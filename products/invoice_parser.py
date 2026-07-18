import json
import difflib
import logging
import base64
import httpx
import fitz
from django.db.models import Q
from pypdf import PdfReader
from groq import Groq
from chatbot.services import _get_groq_api_key, _get_groq_model
from products.models import Product

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_stream):
    """
    Extracts text from each page of a PDF file stream.
    """
    try:
        reader = PdfReader(file_stream)
        text_content = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                text_content.append(text)
        return "\n".join(text_content)
    except Exception as e:
        logger.error(f"Error reading PDF file: {e}")
        raise ValueError(f"Failed to read PDF file content: {str(e)}")

def clean_json_from_llm_response(text):
    """
    Strips away reasoning (<think>...</think>) blocks, markdown blocks,
    and trailing characters to extract raw JSON.
    """
    text = text.strip()
    
    # 1. Remove thinking block if present
    if "<think>" in text:
        parts = text.split("</think>", 1)
        if len(parts) > 1:
            text = parts[1].strip()
            
    # 2. Extract content inside markdown ```json ... ``` or ``` ... ```
    if "```" in text:
        first_idx = text.find("```")
        if text[first_idx:].startswith("```json"):
            start_idx = first_idx + 7
        else:
            start_idx = first_idx + 3
        end_idx = text.find("```", start_idx)
        if end_idx != -1:
            text = text[start_idx:end_idx].strip()
            
    # 3. Restrict content to first '{' and last '}' to strip extra characters
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1:
        text = text[first_brace:last_brace + 1].strip()
        
    return text

def parse_text_with_groq(text, action_type='stock_in'):
    """
    Uses Groq LLM to parse raw invoice or product text into a structured JSON.
    """
    api_key = _get_groq_api_key()
    if not api_key:
        raise ValueError("Groq API key not found in ERP settings. Please configure it in Settings first.")

    model = _get_groq_model()
    client = Groq(api_key=api_key, http_client=httpx.Client())

    if action_type == 'product':
        system_prompt = (
            "You are an expert ERP product catalog parsing system. Analyze the raw text of a product list/sheet and "
            "extract the items list and metadata into a clean, structured JSON object.\n"
            "Output ONLY valid JSON. Do not include markdown formatting, explanations, or backticks.\n\n"
            "JSON SCHEMA:\n"
            "{\n"
            "  \"metadata\": {\n"
            "    \"company_name\": \"string or null (e.g. supplier/distributor company name)\",\n"
            "    \"notes\": \"string or null\"\n"
            "  },\n"
            "  \"items\": [\n"
            "    {\n"
            "      \"raw_name\": \"string (name of the product - mandatory)\",\n"
            "      \"sku\": \"string or null (sku/product code)\",\n"
            "      \"category\": \"string or null (product category, e.g. Beverages, Electronics, etc.)\",\n"
            "      \"cost_price\": \"number (purchase/cost price per unit, default 0.0)\",\n"
            "      \"unit_price\": \"number (retail/selling price per unit, default 0.0)\",\n"
            "      \"quantity\": \"integer (stock/quantity to import, default 0)\",\n"
            "      \"barcode\": \"string or null (single unit barcode)\",\n"
            "      \"pack_barcode\": \"string or null (carton/pack barcode)\",\n"
            "      \"pack_price\": \"number or null (price per carton/pack)\",\n"
            "      \"pcs_per_pack\": \"integer (pieces per carton/pack, default 12)\"\n"
            "    }\n"
            "  ]\n"
            "}"
        )
    else:
        system_prompt = (
            "You are an expert ERP invoice parsing system. Analyze the raw text of an invoice/sales slip and "
            "extract the items list and metadata into a clean, structured JSON object. "
            "Output ONLY valid JSON. Do not include markdown formatting, explanations, or backticks.\n\n"
            "JSON SCHEMA:\n"
            "{\n"
            "  \"metadata\": {\n"
            "    \"company_name\": \"string or null (e.g. supplier/distributor/client company name)\",\n"
            "    \"invoice_date\": \"string or null (format YYYY-MM-DD)\",\n"
            "    \"invoice_number\": \"string or null\",\n"
            "    \"discount\": \"number or null (overall discount amount)\",\n"
            "    \"tax\": \"number or null (overall tax/vat amount)\",\n"
            "    \"notes\": \"string or null\"\n"
            "  },\n"
            "  \"items\": [\n"
            "    {\n"
            "      \"raw_name\": \"string (name/description of the product - mandatory)\",\n"
            "      \"sku\": \"string or null (sku/product code/barcode if listed)\",\n"
            "      \"quantity\": \"integer (default 1 if not specified)\",\n"
            "      \"unit_price\": \"number (cost price or selling price per unit, default 0.0)\",\n"
            "      \"discount\": \"number or null (item-specific discount if any)\",\n"
            "      \"tax\": \"number or null (item-specific tax if any)\"\n"
            "    }\n"
            "  ]\n"
            "}"
        )

    user_prompt = f"Raw Invoice Text:\n\n{text}"

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1
        )
        content = response.choices[0].message.content.strip()
        cleaned_json = clean_json_from_llm_response(content)
        return json.loads(cleaned_json)
    except Exception as e:
        logger.error(f"Groq text parse error: {e}")
        # Try a quick raw attempt without custom options if model name fails
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1
            )
            content = response.choices[0].message.content.strip()
            cleaned_json = clean_json_from_llm_response(content)
            return json.loads(cleaned_json)
        except Exception as fallback_err:
            logger.error(f"Fallback parse failed: {fallback_err}")
            raise ValueError(f"AI parsing failed: {str(e)}")

def match_parsed_items_to_catalog(parsed_data):
    """
    Matches parsed product entries to the catalog database (Products).
    """
    all_products = list(Product.objects.all())
    product_names = [p.name for p in all_products]
    
    sku_map = {p.sku.lower(): p for p in all_products if p.sku}
    barcode_map = {p.barcode: p for p in all_products if p.barcode}
    pack_barcode_map = {p.pack_barcode: p for p in all_products if p.pack_barcode}
    name_map = {p.name.lower(): p for p in all_products}

    matched_items = []
    items = parsed_data.get("items", [])

    for item in items:
        raw_name = item.get("raw_name", "")
        sku = item.get("sku", "")
        quantity = item.get("quantity", 1)
        unit_price = item.get("unit_price", 0.0)
        item_discount = item.get("discount", 0.0)
        item_tax = item.get("tax", 0.0)

        matched_product = None
        confidence = "none"

        # 1. Match by SKU or barcode directly
        if sku:
            sku_clean = str(sku).strip().lower()
            if sku_clean in sku_map:
                matched_product = sku_map[sku_clean]
                confidence = "high"
            elif sku_clean in barcode_map:
                matched_product = barcode_map[sku_clean]
                confidence = "high"
            elif sku_clean in pack_barcode_map:
                matched_product = pack_barcode_map[sku_clean]
                confidence = "high"

        # 2. Match by exact/case-insensitive Name
        if not matched_product and raw_name:
            name_clean = str(raw_name).strip().lower()
            if name_clean in name_map:
                matched_product = name_map[name_clean]
                confidence = "high"

        # 3. Match by partial substring matching
        if not matched_product and raw_name:
            name_clean = str(raw_name).strip().lower()
            matches = [p for p in all_products if name_clean in p.name.lower() or p.name.lower() in name_clean]
            if len(matches) == 1:
                matched_product = matches[0]
                confidence = "medium"

        # 4. Fuzzy match using difflib
        if not matched_product and raw_name:
            name_clean = str(raw_name).strip()
            close_matches = difflib.get_close_matches(name_clean, product_names, n=1, cutoff=0.5)
            if close_matches:
                matched_name = close_matches[0]
                matched_product = next((p for p in all_products if p.name == matched_name), None)
                confidence = "medium"

        # Construct item payload
        matched_items.append({
            "raw_name": raw_name,
            "sku": sku,
            "category": item.get("category", ""),
            "cost_price": item.get("cost_price", 0.0),
            "quantity": quantity,
            "unit_price": unit_price or item.get("cost_price", 0.0),
            "barcode": item.get("barcode", ""),
            "pack_barcode": item.get("pack_barcode", ""),
            "pcs_per_pack": item.get("pcs_per_pack", 12),
            "pack_price": item.get("pack_price", None),
            "discount": item_discount,
            "tax": item_tax,
            "matched_product_id": matched_product.id if matched_product else None,
            "matched_product_name": matched_product.name if matched_product else None,
            "matched_product_sku": matched_product.sku if matched_product else None,
            "matched_product_stock": matched_product.stock_quantity if matched_product else 0,
            "confidence": confidence
        })

    return {
        "metadata": parsed_data.get("metadata", {}),
        "items": matched_items
    }

def parse_scanned_pdf_with_vision(file_stream, action_type='stock_in'):
    """
    Uses PyMuPDF to convert scanned PDF pages into PNG images and sends them
    to Groq Llama/Qwen Vision model to extract structured data.
    """
    api_key = _get_groq_api_key()
    if not api_key:
        raise ValueError("Groq API key not found in settings. Please configure it in API Configuration.")
        
    file_stream.seek(0)
    pdf_bytes = file_stream.read()
    
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        logger.error(f"PyMuPDF open failed: {e}")
        raise ValueError(f"Failed to process scanned PDF: {str(e)}")
        
    num_pages = len(doc)
    if num_pages == 0:
        raise ValueError("The uploaded PDF file has 0 pages.")
        
    image_contents = []
    # Process up to 3 pages to avoid token/rate limits
    for page_idx in range(min(num_pages, 3)):
        page = doc.load_page(page_idx)
        zoom = 2.0  # Render at high resolution for handwritten text clarity
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        img_png_bytes = pix.tobytes("png")
        base64_img = base64.b64encode(img_png_bytes).decode("utf-8")
        image_contents.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/png;base64,{base64_img}"
            }
        })
        
    if action_type == 'product':
        system_prompt = (
            "You are an expert ERP product catalog parsing system. Analyze the uploaded image(s) of a product list/sheet and "
            "extract the items list and metadata into a clean, structured JSON object.\n"
            "The image may be rotated or upside down, please read it carefully.\n"
            "Output ONLY valid JSON. Do not include markdown formatting, explanations, or backticks.\n\n"
            "JSON SCHEMA:\n"
            "{\n"
            "  \"metadata\": {\n"
            "    \"company_name\": \"string or null (e.g. supplier/distributor company name)\",\n"
            "    \"notes\": \"string or null\"\n"
            "  },\n"
            "  \"items\": [\n"
            "    {\n"
            "      \"raw_name\": \"string (name of the product - mandatory)\",\n"
            "      \"sku\": \"string or null (sku/product code)\",\n"
            "      \"category\": \"string or null (product category, e.g. Beverages, Electronics, etc.)\",\n"
            "      \"cost_price\": \"number or null (purchase/cost price per unit)\",\n"
            "      \"unit_price\": \"number or null (retail/selling price per unit)\",\n"
            "      \"quantity\": \"integer or null (stock/quantity to import)\",\n"
            "      \"barcode\": \"string or null (single unit barcode)\",\n"
            "      \"pack_barcode\": \"string or null (carton/pack barcode)\",\n"
            "      \"pack_price\": \"number or null (price per carton/pack)\",\n"
            "      \"pcs_per_pack\": \"integer or null (pieces per carton/pack)\"\n"
            "    }\n"
            "  ]\n"
            "}"
        )
    else:
        system_prompt = (
            "You are an expert ERP invoice parsing system. Analyze the uploaded image(s) of an invoice/sales slip and "
            "extract the items list and metadata into a clean, structured JSON object. "
            "The image may be rotated or upside down, please read it carefully.\n"
            "Output ONLY valid JSON. Do not include markdown formatting, explanations, or backticks.\n\n"
            "JSON SCHEMA:\n"
            "{\n"
            "  \"metadata\": {\n"
            "    \"company_name\": \"string or null (e.g. supplier/distributor/client company name)\",\n"
            "    \"invoice_date\": \"string or null (format YYYY-MM-DD)\",\n"
            "    \"invoice_number\": \"string or null\",\n"
            "    \"discount\": \"number or null (overall discount amount)\",\n"
            "    \"tax\": \"number or null (overall tax/vat amount)\",\n"
            "    \"notes\": \"string or null\"\n"
            "  },\n"
            "  \"items\": [\n"
            "    {\n"
            "      \"raw_name\": \"string (name/description of the product - mandatory)\",\n"
            "      \"sku\": \"string or null (sku/product code/barcode if listed)\",\n"
            "      \"quantity\": \"integer or null (default 1 if not specified)\",\n"
            "      \"unit_price\": \"number or null (cost price or selling price per unit)\",\n"
            "      \"discount\": \"number or null (item-specific discount if any)\",\n"
            "      \"tax\": \"number or null (item-specific tax if any)\"\n"
            "    }\n"
            "  ]\n"
            "}"
        )
        
    vision_model = "qwen/qwen3.6-27b"
    client = Groq(api_key=api_key, http_client=httpx.Client())
    
    content_list = [{"type": "text", "text": "Extract all data from these pages into the requested JSON schema. If columns are missing or values are empty, keep them null. Output ONLY the JSON."}]
    content_list.extend(image_contents)
    
    try:
        response = client.chat.completions.create(
            model=vision_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content_list}
            ],
            temperature=0.7,
            max_tokens=4096
        )
        raw_content = response.choices[0].message.content.strip()
        cleaned_json = clean_json_from_llm_response(raw_content)
        return json.loads(cleaned_json)
    except Exception as e:
        logger.error(f"Groq Vision API error: {e}")
        raise ValueError(f"AI Vision extraction failed: {str(e)}")

def process_invoice_pdf(file_stream, action_type='stock_in'):
    """
    Orchestrates the entire PDF text extraction, Groq structure mapping, and database matching.
    """
    raw_text = extract_text_from_pdf(file_stream)
    
    # 1. If text is completely empty, go straight to vision
    if not raw_text.strip():
        logger.info("PDF has no text. Falling back to Groq Vision API...")
        vision_result = parse_scanned_pdf_with_vision(file_stream, action_type=action_type)
        return match_parsed_items_to_catalog(vision_result)
        
    # 2. Otherwise try parsing the text
    try:
        parsed_json = parse_text_with_groq(raw_text, action_type=action_type)
        
        # If text parsing succeeded but returned 0 items, it could be a scanned image PDF with minor watermark text.
        # Let's fall back to Vision in this case!
        if not parsed_json.get("items"):
            logger.info("Parsed text returned 0 items. Retrying with Groq Vision fallback...")
            vision_result = parse_scanned_pdf_with_vision(file_stream, action_type=action_type)
            return match_parsed_items_to_catalog(vision_result)
            
        return match_parsed_items_to_catalog(parsed_json)
    except Exception as e:
        logger.warning(f"Text parsing failed: {e}. Trying Groq Vision fallback...")
        try:
            vision_result = parse_scanned_pdf_with_vision(file_stream, action_type=action_type)
            return match_parsed_items_to_catalog(vision_result)
        except Exception as vision_err:
            logger.error(f"Groq Vision fallback also failed: {vision_err}")
            raise e
