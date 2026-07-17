import json
import difflib
import logging
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

def parse_text_with_groq(text, action_type='stock_in'):
    """
    Uses Groq LLM to parse raw invoice or product text into a structured JSON.
    """
    api_key = _get_groq_api_key()
    if not api_key:
        raise ValueError("Groq API key not found in ERP settings. Please configure it in Settings first.")

    model = _get_groq_model()
    client = Groq(api_key=api_key)

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
            response_format={"type": "json_object"},
            temperature=0.1
        )
        content = response.choices[0].message.content.strip()
        return json.loads(content)
    except Exception as e:
        logger.error(f"Error parsing text with Groq: {e}")
        # Try a fallback if JSON mode was rejected or failed
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
            # Clean up potential markdown formatting
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            return json.loads(content.strip())
        except Exception as fallback_err:
            logger.error(f"Fallback parse failed: {fallback_err}")
            raise ValueError(f"AI parsing failed: {str(e)}")

def match_parsed_items_to_catalog(parsed_data):
    """
    Matches parsed product entries to the catalog database (Products).
    """
    all_products = list(Product.objects.all())
    product_names = [p.name for p in all_products]
    product_skus = [p.sku for p in all_products if p.sku]
    product_barcodes = [p.barcode for p in all_products if p.barcode]
    product_pack_barcodes = [p.pack_barcode for p in all_products if p.pack_barcode]

    # Create helper lookup dicts
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
            # Try to see if name_clean contains any product name or vice-versa
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

def process_invoice_pdf(file_stream, action_type='stock_in'):
    """
    Orchestrates the entire PDF text extraction, Groq structure mapping, and database matching.
    """
    raw_text = extract_text_from_pdf(file_stream)
    if not raw_text.strip():
        raise ValueError("Could not extract any text content from the PDF file.")
        
    parsed_json = parse_text_with_groq(raw_text, action_type=action_type)
    return match_parsed_items_to_catalog(parsed_json)
