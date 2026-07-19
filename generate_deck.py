import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def main():
    prs = Presentation()
    # Set 16:9 widescreen slides
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Color Scheme (Premium Dark Tech Mode)
    BG_COLOR = RGBColor(10, 17, 40)       # Dark Navy
    CARD_COLOR = RGBColor(20, 27, 54)     # Slightly lighter dark navy for content cards
    TITLE_COLOR = RGBColor(56, 189, 248)  # Bright Sky Blue
    TEXT_COLOR = RGBColor(241, 245, 249)  # Off-white
    MUTED_COLOR = RGBColor(148, 163, 184) # Muted Silver-Gray
    ACCENT_COLOR = RGBColor(45, 212, 191) # Mint/Teal
    CODE_BG = RGBColor(15, 23, 42)        # Very dark gray/black for code blocks

    # Remove default layout slide and use a blank one for full design control
    blank_layout = prs.slide_layouts[6]

    # Helper function to paint slide background
    def paint_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background() # No border
        return bg

    # Helper function to create content cards
    def add_card(slide, left, top, width, height, title_text=None, title_color=ACCENT_COLOR):
        # Background card shape
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_COLOR
        card.line.color.rgb = RGBColor(30, 41, 73)
        card.line.width = Pt(1.5)
        
        # Add card title if provided
        if title_text:
            tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.15), width - Inches(0.4), Inches(0.5))
            tf = tb.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = title_text
            p.font.name = 'Segoe UI'
            p.font.size = Pt(20)
            p.font.bold = True
            p.font.color.rgb = title_color
            
        return card

    # Helper to add standard title
    def add_slide_header(slide, title_text, category="BIZIONARY ERP"):
        paint_bg(slide)
        
        # Category label (e.g. BIZIONARY ERP)
        cat_tb = slide.shapes.add_textbox(Inches(0.75), Inches(0.3), Inches(11.833), Inches(0.3))
        cat_tf = cat_tb.text_frame
        cat_tf.word_wrap = True
        cat_tf.margin_left = cat_tf.margin_top = cat_tf.margin_bottom = cat_tf.margin_right = 0
        cat_p = cat_tf.paragraphs[0]
        cat_p.text = category.upper()
        cat_p.font.name = 'Segoe UI'
        cat_p.font.size = Pt(11)
        cat_p.font.bold = True
        cat_p.font.color.rgb = ACCENT_COLOR
        
        # Main Title
        title_tb = slide.shapes.add_textbox(Inches(0.75), Inches(0.55), Inches(11.833), Inches(0.8))
        title_tf = title_tb.text_frame
        title_tf.word_wrap = True
        title_tf.margin_left = title_tf.margin_top = title_tf.margin_bottom = title_tf.margin_right = 0
        title_p = title_tf.paragraphs[0]
        title_p.text = title_text
        title_p.font.name = 'Segoe UI'
        title_p.font.size = Pt(32)
        title_p.font.bold = True
        title_p.font.color.rgb = TITLE_COLOR

    # Helper to add bullet points with bold sub-headers
    def add_bullet_points(slide, items, left, top, width, height, font_size=16):
        tb = slide.shapes.add_textbox(left, top, width, height)
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_bottom = tf.margin_right = 0
        
        for idx, item in enumerate(items):
            p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
            p.font.name = 'Segoe UI'
            p.font.size = Pt(font_size)
            p.space_after = Pt(8)
            
            # Check if there is a header section (split by ': ')
            if ': ' in item and not item.startswith('http'):
                parts = item.split(': ', 1)
                run1 = p.add_run()
                run1.text = "• " + parts[0] + ": "
                run1.font.bold = True
                run1.font.color.rgb = TITLE_COLOR
                
                run2 = p.add_run()
                run2.text = parts[1]
                run2.font.bold = False
                run2.font.color.rgb = TEXT_COLOR
            else:
                p.text = "• " + item
                p.font.color.rgb = TEXT_COLOR

    # Helper to add a formatted code block card
    def add_code_block(slide, left, top, width, height, code_text):
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = CODE_BG
        card.line.color.rgb = RGBColor(51, 65, 85) # Slate-700
        card.line.width = Pt(1.5)
        
        tb = slide.shapes.add_textbox(left + Inches(0.15), top + Inches(0.15), width - Inches(0.3), height - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_bottom = tf.margin_right = 0
        
        p = tf.paragraphs[0]
        p.text = code_text
        p.font.name = 'Consolas'
        p.font.size = Pt(11)
        p.font.color.rgb = RGBColor(14, 165, 233) # Cyan text

    # ==========================================
    # SLIDE 1: Title Slide (Dark Tech Style)
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    paint_bg(s1)
    
    # Large Title text box
    tb = s1.shapes.add_textbox(Inches(0.75), Inches(2.2), Inches(11.833), Inches(2.5))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "BIZIONARY ERP SYSTEM"
    p.font.name = 'Segoe UI'
    p.font.size = Pt(56)
    p.font.bold = True
    p.font.color.rgb = TITLE_COLOR
    
    p2 = tf.add_paragraph()
    p2.text = "Secure, Agentic AI-Enabled Enterprise Resource Planning platform for SMEs"
    p2.font.name = 'Segoe UI'
    p2.font.size = Pt(20)
    p2.font.color.rgb = ACCENT_COLOR
    p2.space_before = Pt(12)
    
    # Author Info Card
    add_card(s1, Inches(0.75), Inches(5.0), Inches(5.5), Inches(1.5), "Final Year Project Presentation")
    info_points = [
        "Primary Goal: Unifying sales, procurement, ledgers, and conversational AI",
        "Design Theme: Premium Dark Mode with sub-second API performance"
    ]
    add_bullet_points(s1, info_points, Inches(0.9), Inches(5.6), Inches(5.2), Inches(0.8), font_size=12)

    # ==========================================
    # SLIDE 2: Project Overview
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_slide_header(s2, "Project Overview")
    
    # Two Columns: Description Card & Scope Card
    add_card(s2, Inches(0.75), Inches(1.8), Inches(5.6), Inches(4.8), "Core ERP Concept", TITLE_COLOR)
    desc_points = [
        "Enterprise-Grade Design: Centralized repository integrating product catalogs, real-time inventory levels, multi-channel sales tracking, and client invoicing.",
        "Double-Entry Integrity: Automated ledger postings via event-driven database signals ensuring strict financial audits.",
        "Embedded Business Intelligence: AI chatbot utilizing LLM tool-calling and predictive analytics for data-driven decisions."
    ]
    add_bullet_points(s2, desc_points, Inches(1.0), Inches(2.4), Inches(5.1), Inches(3.8), font_size=15)
    
    add_card(s2, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8), "Platform Deliverables", ACCENT_COLOR)
    scope_points = [
        "Single-Tenant Multi-User Role Access: Secure views for Accountant, Manager, and Administrator.",
        "Dynamic Monthly Excel Parser: Automatic processing and schema-matching of raw operational workbooks.",
        "Secure Administrative Panel: Dynamic key storage, cached API validation, and key rotation without system downtime.",
        "Responsive SPA Interface: Rich data visualization and offline client-side exports."
    ]
    add_bullet_points(s2, scope_points, Inches(7.23), Inches(2.4), Inches(5.1), Inches(3.8), font_size=15)

    # ==========================================
    # SLIDE 3: Problem Statement
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_slide_header(s3, "Problem Statement")
    
    add_card(s3, Inches(0.75), Inches(1.8), Inches(11.83), Inches(4.8), "Why Traditional Systems Fail Small & Medium Enterprises", RGBColor(239, 68, 68))
    prob_points = [
        "Fragmented Tools & Offline Spreadsheets: Multi-department operations use separated offline logs (purchases in Excel, invoices on paper, receipts in PDF). This leads to massive stock discrepancies.",
        "Lack of Audit Trail and Immutability: Manual updates lack structured constraints. Unauthorized stock overrides or accounting anomalies occur without any trackable historical logs.",
        "No Real-Time Visibility/Insights: Management does not have instantaneous access to aggregated cash flows, profit and loss, or demand charts. Crucial metrics are compiled manually at the end of the month.",
        "Costly Restocking Operations: Reorder levels are estimated or checked physically, leading to stockouts during peaks or tied-up cash in slow-moving overstock."
    ]
    add_bullet_points(s3, prob_points, Inches(1.0), Inches(2.5), Inches(11.33), Inches(3.8), font_size=16)

    # ==========================================
    # SLIDE 4: Proposed Solution & Objectives
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_slide_header(s4, "Proposed Solution & Objectives")
    
    add_card(s4, Inches(0.75), Inches(1.8), Inches(5.6), Inches(4.8), "The Bizionary Approach", ACCENT_COLOR)
    sol_points = [
        "Data Consolidation: Unified relational database binding products, stock transactions, journal logs, and invoices.",
        "Automated PDF & Excel Ingest: Clean drag-and-drop parsing to convert monthly sales files into structured db records.",
        "Strict Double-Entry Ledger: Auto-balancing postings of COGS, Assets, Accounts Payables, and Expenses on every transaction."
    ]
    add_bullet_points(s4, sol_points, Inches(1.0), Inches(2.5), Inches(5.1), Inches(3.7), font_size=16)
    
    add_card(s4, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8), "Core Development Milestones", TITLE_COLOR)
    obj_points = [
        "Incorporate Conversational AI: An agentic RAG chatbot utilizing Groq tool-use function calling for natural-language database reports.",
        "Analytics Dashboard: Smart pricing advice, sentiment analysis, and demand calculations.",
        "Zero-Downtime System Administration: Secure database storage, dynamic loading, and in-memory key cache rotation."
    ]
    add_bullet_points(s4, obj_points, Inches(7.23), Inches(2.5), Inches(5.1), Inches(3.7), font_size=16)

    # ==========================================
    # SLIDE 5: System Architecture & Integration
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_slide_header(s5, "System Architecture")
    
    # Left description card
    add_card(s5, Inches(0.75), Inches(1.8), Inches(4.5), Inches(4.8), "3-Tier Decoupled Pattern", TITLE_COLOR)
    arch_points = [
        "Client Layer: React 19 SPA served on edge CDNs (Vite, Recharts, Tailwind CSS v4).",
        "Application Layer: Stateless Django REST APIs running in containerized runtimes.",
        "Database Layer: SQLite 3 / PostgreSQL DB enforcing strict relational rules.",
        "Cognitive Layer: Sub-second NLP response pipeline connected to Groq and OpenAI."
    ]
    add_bullet_points(s5, arch_points, Inches(1.0), Inches(2.4), Inches(4.0), Inches(3.9), font_size=14)
    
    # Right Diagram box
    add_card(s5, Inches(5.5), Inches(1.8), Inches(7.08), Inches(4.8), "Component Data & Action Flow", ACCENT_COLOR)
    diagram_box = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.8), Inches(2.5), Inches(6.48), Inches(3.7))
    diagram_box.fill.solid()
    diagram_box.fill.fore_color.rgb = CODE_BG
    diagram_box.line.color.rgb = RGBColor(30, 41, 73)
    
    db_tf = diagram_box.text_frame
    db_tf.word_wrap = True
    p = db_tf.paragraphs[0]
    p.text = (
        " [ React Client (SPA) ]  <-- (HTTPS JWT REST API) -->  [ Django DRF App Server ]\n"
        "                                                              |\n"
        "   +----------------------------------------------------------+\n"
        "   |                                                          |\n"
        "   v (Event Signals)                                          v (API Key Cache / SDK)\n"
        "[ SQLite / PostgreSQL DB ]                                 [ Cognitive AI Layer ]\n"
        " - Inventory Transactions                                   - Groq Llama 3.3 (Tool-use)\n"
        " - Double-entry Accounting Ledger                           - OpenAI GPT Models"
    )
    p.font.name = 'Consolas'
    p.font.size = Pt(12)
    p.font.color.rgb = RGBColor(14, 165, 233)
    p.space_after = Pt(6)

    # ==========================================
    # SLIDE 6: Technology Stack Matrix
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_slide_header(s6, "Technology Stack Matrix")
    
    # Column 1: Frontend
    add_card(s6, Inches(0.75), Inches(1.8), Inches(3.7), Inches(4.8), "Frontend Tier", TITLE_COLOR)
    fe_stack = [
        "Vite + React: Hot-reloaded SPA interface.",
        "Tailwind CSS v4: responsive design engine.",
        "Recharts / ECharts: visual sales and accounts charts.",
        "jsPDF: client-side offline invoice downloads."
    ]
    add_bullet_points(s6, fe_stack, Inches(0.95), Inches(2.5), Inches(3.3), Inches(3.8), font_size=14)
    
    # Column 2: Backend & DB
    add_card(s6, Inches(4.8), Inches(1.8), Inches(3.7), Inches(4.8), "Backend & Data", ACCENT_COLOR)
    be_stack = [
        "Django framework: secure business logic framework.",
        "Django REST Framework: JWT-authenticated endpoints.",
        "Pandas & openpyxl: dynamic monthly Excel workbook parser.",
        "SQLite & PostgreSQL: transactional DB integrity."
    ]
    add_bullet_points(s6, be_stack, Inches(5.0), Inches(2.5), Inches(3.3), Inches(3.8), font_size=14)
    
    # Column 3: AI & Deployment
    add_card(s6, Inches(8.85), Inches(1.8), Inches(3.7), Inches(4.8), "AI & Infrastructure", RGBColor(168, 85, 247))
    ai_stack = [
        "Groq LLM SDK: high-performance Llama 3.3 chatbot engine.",
        "OpenAI API: semantic sentiment analysis and summaries.",
        "Railway Containers: backend web deployment.",
        "Vercel CDN: frontend static file hosting."
    ]
    add_bullet_points(s6, ai_stack, Inches(9.05), Inches(2.5), Inches(3.3), Inches(3.8), font_size=14)

    # ==========================================
    # SLIDE 7: Key Architectural Decisions
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    add_slide_header(s7, "Key Architectural Choices")
    
    add_card(s7, Inches(0.75), Inches(1.8), Inches(11.83), Inches(4.8), "Decisions Driving Security, Speed, and Integrity", ACCENT_COLOR)
    dec_points = [
        "Vite Single Page Application (SPA) over SSR: Renders immediate UI interactions. Sidebar, analytical charts, sales totals, and inventory tables update dynamically without annoying full-page browser refreshes.",
        "Django post-save Signals over Manual Service Triggers: Double-entry accounting registers must balance to zero. Using database signals guarantees that transaction creations (e.g. creating a sales receipt) atomically write appropriate ledger debit/credit postings in the same SQL commit.",
        "Groq Llama 3.3 Cloud API over Self-Hosted Models: Conversational RAG databases require sub-second generation. Groq's high token-per-second output speeds up tool-calling and report building, keeping the chatbot responsive.",
        "Decoupled Deployment Layout (Vercel + Railway): By placing compiled React static files on Vercel's global edge network and running Python on Railway container instances, we achieve near-instant client page loads."
    ]
    add_bullet_points(s7, dec_points, Inches(1.0), Inches(2.5), Inches(11.33), Inches(3.8), font_size=16)

    # ==========================================
    # SLIDE 8: Core ERP Business Workflows
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    add_slide_header(s8, "Core ERP Business Workflows")
    
    add_card(s8, Inches(0.75), Inches(1.8), Inches(3.7), Inches(4.8), "Inventory Management", TITLE_COLOR)
    inv_points = [
        "Dynamic stock warnings.",
        "Detailed restock tracking.",
        "Direct stock purchase system adds products immediately to shop or warehouse."
    ]
    add_bullet_points(s8, inv_points, Inches(0.95), Inches(2.4), Inches(3.3), Inches(3.9), font_size=15)
    
    add_card(s8, Inches(4.8), Inches(1.8), Inches(3.7), Inches(4.8), "Procurement & Suppliers", ACCENT_COLOR)
    proc_points = [
        "Supplier profiles with category.",
        "Ordered slips generated on pending purchases.",
        "Real-time due-date alerts for outstanding deliveries."
    ]
    add_bullet_points(s8, proc_points, Inches(5.0), Inches(2.4), Inches(3.3), Inches(3.9), font_size=15)
    
    add_card(s8, Inches(8.85), Inches(1.8), Inches(3.7), Inches(4.8), "Sales & Returns Ledger", RGBColor(234, 179, 8))
    sale_points = [
        "Instant invoice generation.",
        "Sales returns processing.",
        "Double-entry ledger posts COGS and cash/receivables instantly on validation."
    ]
    add_bullet_points(s8, sale_points, Inches(9.05), Inches(2.4), Inches(3.3), Inches(3.9), font_size=15)

    # ==========================================
    # SLIDE 9: Double-Entry Financial Accounting
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    add_slide_header(s9, "Double-Entry Accounting System")
    
    add_card(s9, Inches(0.75), Inches(1.8), Inches(5.6), Inches(4.8), "Structure & Auditing", TITLE_COLOR)
    acc_points1 = [
        "Multi-Level Chart of Accounts (COA): Hierarchy consisting of Assets, Liabilities, Equity, Revenues, and Expenses.",
        "Strict Balancing Rule: Debits must equal Credits for every logged transaction. Journal entries cannot be saved in an unbalanced state.",
        "Audit trail tracking: Real-time ledger entries provide chronological traces for accounting checks."
    ]
    add_bullet_points(s9, acc_points1, Inches(1.0), Inches(2.4), Inches(5.1), Inches(3.8), font_size=16)
    
    add_card(s9, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8), "Automated Signal Mapping", ACCENT_COLOR)
    acc_points2 = [
        "Sales Posting: DR Cash/Bank (1010) or Accounts Receivable (1200) | CR Revenue (4010). DR COGS (5010) | CR Inventory Asset (1100).",
        "Direct Purchases: DR Inventory Asset (1100) or COGS (5010) | CR Cash (1010) or Accounts Payable (2010).",
        "Automatic reversal: Returns dynamically post offset transactions, ensuring financial balances reflect stock movement."
    ]
    add_bullet_points(s9, acc_points2, Inches(7.23), Inches(2.4), Inches(5.1), Inches(3.8), font_size=16)

    # ==========================================
    # SLIDE 10: AI Chatbot Assistant (Agentic Conversational RAG)
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    add_slide_header(s10, "Conversational AI Chatbot")
    
    add_card(s10, Inches(0.75), Inches(1.8), Inches(5.6), Inches(4.8), "Agentic Chatbot Capabilities", TITLE_COLOR)
    bot_points = [
        "Dynamic Database Agent: Utilizes Llama 3.3 on Groq with function-calling schemas to translate user prompts into structured API queries.",
        "Operational RAG Reporting: Summarizes low-stock alerts, counts unpaid invoices, filters periods, and lists top suppliers.",
        "Conversational Visualization: The chatbot can generate and render interactive sales graphs directly in the chat panel based on live query results."
    ]
    add_bullet_points(s10, bot_points, Inches(1.0), Inches(2.4), Inches(5.1), Inches(3.8), font_size=16)
    
    add_card(s10, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8), "Function Calling Flow", ACCENT_COLOR)
    bot_flow = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.23), Inches(2.4), Inches(5.1), Inches(3.9))
    bot_flow.fill.solid()
    bot_flow.fill.fore_color.rgb = CODE_BG
    bot_flow.line.color.rgb = RGBColor(30, 41, 73)
    
    bf_tf = bot_flow.text_frame
    bf_tf.word_wrap = True
    bf_p = bf_tf.paragraphs[0]
    bf_p.text = (
        "User: 'Which products are low on stock?'\n"
        "  |\n"
        "  v\n"
        "Groq (Llama 3.3): Detects query needs list_low_stock()\n"
        "  |\n"
        "  v (Executes locally on Django server)\n"
        "API Service: Product.objects.filter(stock <= min_stock)\n"
        "  |\n"
        "  v\n"
        "Groq: Receives list JSON -> Formulates natural response\n"
        "  |\n"
        "  v\n"
        "User UI: 'You have 3 items low on stock: Pepsi, Lays...'"
    )
    bf_p.font.name = 'Consolas'
    bf_p.font.size = Pt(11)
    bf_p.font.color.rgb = RGBColor(14, 165, 233)

    # ==========================================
    # SLIDE 11: AI Analytics & Predictions
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    add_slide_header(s11, "AI Predictive Analytics Engine")
    
    add_card(s11, Inches(0.75), Inches(1.8), Inches(11.83), Inches(4.8), "Business Intelligence Models & Processing", ACCENT_COLOR)
    anal_points = [
        "Demand & Sales Velocity Analysis: Checks current sales trends to calculate demand velocity (Fast, Moderate, Slow) for every product catalog item.",
        "NLP Automatic Business Reporting: Generates written reports summarizing current month revenues, top performing items, and critical alerts.",
        "Smart Reordering Calculations: Calculates the exact recommended reorder quantities based on average daily sales and lead times.",
        "Pricing Optimization Suggestions: Recommends margin adjustments if sales velocity rises above historical thresholds.",
        "Sentiment Evaluation: Evaluates customer feedback text using NLP classification (Positive, Neutral, Negative) to alert management on support metrics."
    ]
    add_bullet_points(s11, anal_points, Inches(1.0), Inches(2.4), Inches(11.33), Inches(3.9), font_size=16)

    # ==========================================
    # SLIDE 12: Code Highlight - Double Entry Ledger Signals
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    add_slide_header(s12, "Code Highlight: Automated Ledger Postings")
    
    # Left code panel
    code_text_1 = (
        "@receiver(post_save, sender=Purchase)\n"
        "def update_product_stock_on_save(sender, instance, created, **kwargs):\n"
        "    # Get delivery location (SHOP or WAREHOUSE)\n"
        "    location = getattr(instance, 'delivery_location', 'WAREHOUSE')\n"
        "    qty = instance.quantity_purchased\n"
        "    product = instance.product\n"
        "\n"
        "    if created:\n"
        "        # Route and increment stock based on location\n"
        "        if location == 'SHOP':\n"
        "            product.shop_stock += qty\n"
        "        else:\n"
        "            product.warehouse_stock += qty\n"
        "        product.save()\n"
        "\n"
        "        # Automatically log InventoryTransaction\n"
        "        InventoryTransaction.objects.create(\n"
        "            product=product, quantity=qty, txn_type='IN', ...\n"
        "        )"
    )
    add_code_block(s12, Inches(0.75), Inches(1.8), Inches(6.0), Inches(4.8), code_text_1)
    
    # Right explanation panel
    add_card(s12, Inches(7.0), Inches(1.8), Inches(5.58), Inches(4.8), "Dynamic Stock Routing", ACCENT_COLOR)
    exp_points_1 = [
        "Event-Driven Triggers: Django database signals run on every transactional save to synchronize related tables.",
        "Warehouse vs. Shop Routing: Automatically checks the delivery destination and updates the corresponding stock field.",
        "Audit Immutability: Creates an InventoryTransaction record simultaneously to build a permanent, trackable stock audit ledger."
    ]
    add_bullet_points(s12, exp_points_1, Inches(7.2), Inches(2.5), Inches(5.1), Inches(3.7), font_size=15)

    # ==========================================
    # SLIDE 13: Code Highlight - Chatbot Tool Schemas
    # ==========================================
    s13 = prs.slides.add_slide(blank_layout)
    add_slide_header(s13, "Code Highlight: Chatbot Tool Schemas")
    
    # Left code panel
    code_text_2 = (
        "CHATBOT_TOOLS = [\n"
        "    {\n"
        "        'type': 'function',\n"
        "        'function': {\n"
        "            'name': 'list_low_stock_products',\n"
        "            'description': 'Retrieve products with stock <= min_stock',\n"
        "            'parameters': {\n"
        "                'type': 'object',\n"
        "                'properties': {},\n"
        "                'required': []\n"
        "            }\n"
        "        }\n"
        "    },\n"
        "    {\n"
        "        'type': 'function',\n"
        "        'function': {\n"
        "            'name': 'query_sales_trends',\n"
        "            'description': 'Aggregates sales for a specific date range',\n"
        "            'parameters': {\n"
        "                'type': 'object',\n"
        "                'properties': {\n"
        "                    'start_date': {'type': 'string', 'format': 'date'},\n"
        "                    'end_date': {'type': 'string', 'format': 'date'}\n"
        "                }\n"
        "            }\n"
        "        }\n"
        "    }\n"
        "]"
    )
    add_code_block(s13, Inches(0.75), Inches(1.8), Inches(6.0), Inches(4.8), code_text_2)
    
    # Right explanation panel
    add_card(s13, Inches(7.0), Inches(1.8), Inches(5.58), Inches(4.8), "Groq Tool Calling Definition", TITLE_COLOR)
    exp_points_2 = [
        "Structured Declarations: Declares available Python functions to the LLM as JSON schemas.",
        "Parameter Validation: Enforces constraints (like start/end dates for trend analysis) so the LLM outputs valid JSON parameters.",
        "Agentic Translation: Allows the model to autonomously choose the correct tool to fetch live, accurate data rather than fabricating reports."
    ]
    add_bullet_points(s13, exp_points_2, Inches(7.2), Inches(2.5), Inches(5.1), Inches(3.7), font_size=15)

    # ==========================================
    # SLIDE 14: Technical Challenges & Solutions
    # ==========================================
    s14 = prs.slides.add_slide(blank_layout)
    add_slide_header(s14, "Technical Challenges & Solutions")
    
    add_card(s14, Inches(0.75), Inches(1.8), Inches(5.6), Inches(4.8), "Dynamic Column Excel Parsing", TITLE_COLOR)
    chal_points_1 = [
        "Challenge: Uploaded sales worksheets vary monthly. Different columns names, blank rows, and changing date formats make parsing fragile.",
        "Solution: Implemented a robust parser using Pandas. The parser dynamically checks sheet names, matches headers case-insensitively, and handles errors cleanly to ensure correct database writes."
    ]
    add_bullet_points(s14, chal_points_1, Inches(1.0), Inches(2.4), Inches(5.1), Inches(3.8), font_size=16)
    
    add_card(s14, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8), "Low-Latency AI Chatbot Queries", ACCENT_COLOR)
    chal_points_2 = [
        "Challenge: Traditional database query processing using natural language can take 5+ seconds, resulting in poor user experience.",
        "Solution: Leveraged Groq's Llama 3.3 models for sub-second text processing, and cached admin settings keys in-memory to prevent redundant database checks."
    ]
    add_bullet_points(s14, chal_points_2, Inches(7.23), Inches(2.4), Inches(5.1), Inches(3.8), font_size=16)

    # ==========================================
    # SLIDE 15: Data Portability & Disaster Recovery
    # ==========================================
    s15 = prs.slides.add_slide(blank_layout)
    add_slide_header(s15, "Data Portability & Porting")
    
    add_card(s15, Inches(0.75), Inches(1.8), Inches(5.6), Inches(4.8), "Self-Contained SQLite Backups", TITLE_COLOR)
    port_points_1 = [
        "Database Portability: All records (products, transactions, cash flows, user credentials) are saved in a single, robust file named `db.sqlite3`.",
        "Physical Isolation: The database resides inside the `_internal` subdirectory of the compiled standalone package.",
        "Simple Copy-Paste Backup: Users can back up their entire store database by making a duplicate copy of `db.sqlite3`."
    ]
    add_bullet_points(s15, port_points_1, Inches(1.0), Inches(2.4), Inches(5.1), Inches(3.8), font_size=16)
    
    add_card(s15, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8), "Procedure for Updating System", ACCENT_COLOR)
    port_points_2 = [
        "1. Copy Old DB: Go to the old folder and copy `BizionaryERP/_internal/db.sqlite3`.",
        "2. Extract New Version: Extract the updated compiled zip package.",
        "3. Replace Template: Paste the copied `db.sqlite3` file into the new `_internal` directory, replacing the blank database.",
        "4. Run Launcher: Double-click the launch script; all historical records will load immediately."
    ]
    add_bullet_points(s15, port_points_2, Inches(7.23), Inches(2.4), Inches(5.1), Inches(3.8), font_size=16)

    # ==========================================
    # SLIDE 16: Future Enhancements
    # ==========================================
    s16 = prs.slides.add_slide(blank_layout)
    add_slide_header(s16, "Future Enhancements")
    
    add_card(s16, Inches(0.75), Inches(1.8), Inches(11.83), Inches(4.8), "Scalability & Product Roadmap", ACCENT_COLOR)
    future_points = [
        "Multi-Tenant SaaS Support: Transition the current single-enterprise design to support multi-tenant user bases, permitting multiple businesses to register and manage their operations independently.",
        "Hardware Integration: Build direct interfaces for POS peripheral devices, including barcode scanners, receipt thermal printers, and electronic cash drawers.",
        "Automated Notifications Pipeline: Connect SMS (Twilio) and Email (SendGrid) triggers to dynamically alert suppliers on low stock, send invoice reminders to customers, and email managers financial summaries.",
        "Extended AI Capabilities: Build deep learning models for advanced predictive demand forecasting based on external seasonal events, market trends, and historic data."
    ]
    add_bullet_points(s16, future_points, Inches(1.0), Inches(2.4), Inches(11.33), Inches(3.9), font_size=16)

    # ==========================================
    # SLIDE 17: Thank You & Q&A
    # ==========================================
    s17 = prs.slides.add_slide(blank_layout)
    paint_bg(s17)
    
    # Text Box centered
    tb = s17.shapes.add_textbox(Inches(0.75), Inches(2.5), Inches(11.833), Inches(3.0))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "THANK YOU!"
    p.font.name = 'Segoe UI'
    p.font.size = Pt(64)
    p.font.bold = True
    p.font.color.rgb = TITLE_COLOR
    p.alignment = PP_ALIGN.CENTER
    
    p2 = tf.add_paragraph()
    p2.text = "Questions & Answers Session"
    p2.font.name = 'Segoe UI'
    p2.font.size = Pt(24)
    p2.font.color.rgb = ACCENT_COLOR
    p2.alignment = PP_ALIGN.CENTER
    p2.space_before = Pt(12)
    
    # Save the presentation
    filename = "BizionaryERP_Presentation.pptx"
    prs.save(filename)
    print(f"Presentation saved successfully as {filename}")

if __name__ == '__main__':
    main()
