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
    CARD_BORDER = RGBColor(30, 41, 73)

    blank_layout = prs.slide_layouts[6]

    # Helper function to paint slide background
    def paint_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background()
        return bg

    # Helper function to create content cards
    def add_card(slide, left, top, width, height, title_text=None, title_color=ACCENT_COLOR):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_COLOR
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1.5)
        
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

    # Helper to add standard header
    def add_slide_header(slide, title_text, category="BIZIONARY ERP SYSTEM"):
        paint_bg(slide)
        
        # Category label
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
    def add_bullet_points(slide, items, left, top, width, height, font_size=15):
        tb = slide.shapes.add_textbox(left, top, width, height)
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_bottom = tf.margin_right = 0
        
        for idx, item in enumerate(items):
            p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
            p.font.name = 'Segoe UI'
            p.font.size = Pt(font_size)
            p.space_after = Pt(6)
            
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

    # Helper to insert UI image with card outline
    def add_ui_image(slide, image_filename, left, top, width, height):
        # Card border back of picture
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left - Inches(0.08), top - Inches(0.08), width + Inches(0.16), height + Inches(0.16))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_COLOR
        card.line.color.rgb = ACCENT_COLOR
        card.line.width = Pt(2.0)
        
        # Add picture
        image_path = os.path.join(os.getcwd(), "ui pics", image_filename)
        if os.path.exists(image_path):
            slide.shapes.add_picture(image_path, left, top, width, height)
        else:
            # Fallback label if image is missing
            tb = slide.shapes.add_textbox(left, top + (height/2) - Inches(0.5), width, Inches(1.0))
            tf = tb.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = f"[Image Missing: {image_filename}]"
            p.alignment = PP_ALIGN.CENTER
            p.font.name = 'Segoe UI'
            p.font.size = Pt(16)
            p.font.color.rgb = RGBColor(239, 68, 68)

    # ==========================================
    # SLIDE 1: Title & Introduction Slide
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    paint_bg(s1)
    
    # Large Title text box
    tb = s1.shapes.add_textbox(Inches(0.75), Inches(2.0), Inches(11.833), Inches(2.5))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "BIZIONARY ERP SYSTEM"
    p.font.name = 'Segoe UI'
    p.font.size = Pt(56)
    p.font.bold = True
    p.font.color.rgb = TITLE_COLOR
    
    p2 = tf.add_paragraph()
    p2.text = "A Secure, Agentic AI-Enabled Enterprise Resource Planning Platform for SMEs"
    p2.font.name = 'Segoe UI'
    p2.font.size = Pt(20)
    p2.font.color.rgb = ACCENT_COLOR
    p2.space_before = Pt(8)
    
    # Bottom description cards (Three Columns)
    add_card(s1, Inches(0.75), Inches(4.8), Inches(3.7), Inches(1.8), "Corporate Ledgers")
    points_1 = [
        "Consolidated relational schema",
        "Strict double-entry journal logs",
        "Signal-driven inventory ledgers"
    ]
    add_bullet_points(s1, points_1, Inches(0.95), Inches(5.3), Inches(3.3), Inches(1.2), font_size=12)
    
    add_card(s1, Inches(4.8), Inches(4.8), Inches(3.7), Inches(1.8), "AI-Driven Insights")
    points_2 = [
        "Groq Llama 3.3 chatbot RAG",
        "NLP pricing recommendations",
        "Stock velocity demand forecasts"
    ]
    add_bullet_points(s1, points_2, Inches(5.0), Inches(5.3), Inches(3.3), Inches(1.2), font_size=12)
    
    add_card(s1, Inches(8.85), Inches(4.8), Inches(3.7), Inches(1.8), "Dynamic Ingest")
    points_3 = [
        "Drag & Drop sales PDF uploader",
        "Robust monthly Excel parser",
        "Zero-downtime key administration"
    ]
    add_bullet_points(s1, points_3, Inches(9.05), Inches(5.3), Inches(3.3), Inches(1.2), font_size=12)

    # ==========================================
    # SLIDE 2: Problem & Solution
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_slide_header(s2, "The Problem vs. The Bizionary Solution")
    
    # Left Column: Problem (Red Header)
    add_card(s2, Inches(0.75), Inches(1.8), Inches(5.6), Inches(4.8), "SME Operational Bottlenecks", RGBColor(239, 68, 68))
    prob_points = [
        "Fragmented Tools: Relying on paper billing, disconnected PDFs, and offline spreadsheets leads to massive inventory and ledger errors.",
        "No Transactional Audits: Manual database overrides occur without log checks, causing trace errors or unauthorized stock edits.",
        "Delayed Business Intelligence: Managers must compile logs manually at month-end to understand cash flows or revenue margins.",
        "Manual Restock Checks: Physical inventory checks lead to unexpected stockouts or expensive cash-blocking overstocks."
    ]
    add_bullet_points(s2, prob_points, Inches(0.95), Inches(2.4), Inches(5.2), Inches(3.9), font_size=14)
    
    # Right Column: Solution (Green Header)
    add_card(s2, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8), "The Integrated Solution", ACCENT_COLOR)
    sol_points = [
        "Centralized ERP Architecture: Relational database linking Sales, Purchases, Ledgers, Invoices, and Inventory in one schema.",
        "Automated Signals Ledger: Post-save hooks run debits/credits and update inventory counts automatically upon saving transactions.",
        "Sub-Second Conversational BI: Manager-level chatbot translating natural language queries to fetch real-time reports.",
        "Automated Ingestion Pipeline: Parse dynamic monthly sales worksheets and drag-and-drop PDF invoices to update system counts."
    ]
    add_bullet_points(s2, sol_points, Inches(7.18), Inches(2.4), Inches(5.2), Inches(3.9), font_size=14)

    # ==========================================
    # SLIDE 3: Tech Stack (Visualization)
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_slide_header(s3, "Enterprise Technology Stack")
    
    # Five vertical/grid card blocks (Visual Stack)
    # Block 1: Front-end
    add_card(s3, Inches(0.75), Inches(1.8), Inches(2.2), Inches(4.8), "React Client", TITLE_COLOR)
    card_shape_1 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.95), Inches(2.4), Inches(1.8), Inches(3.9))
    card_shape_1.fill.solid(); card_shape_1.fill.fore_color.rgb = CODE_BG; card_shape_1.line.color.rgb = CARD_BORDER
    tf1 = card_shape_1.text_frame; tf1.word_wrap = True
    p1 = tf1.paragraphs[0]; p1.text = "FRONTEND SPA\n\n• React 19.2 (Vite)\n• Tailwind CSS v4\n• Lucide Icons\n• Recharts graphs\n• jsPDF generator"
    p1.font.name = 'Segoe UI'; p1.font.size = Pt(13); p1.font.color.rgb = TEXT_COLOR
    
    # Block 2: Backend
    add_card(s3, Inches(3.2), Inches(1.8), Inches(2.2), Inches(4.8), "Django Server", ACCENT_COLOR)
    card_shape_2 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(3.4), Inches(2.4), Inches(1.8), Inches(3.9))
    card_shape_2.fill.solid(); card_shape_2.fill.fore_color.rgb = CODE_BG; card_shape_2.line.color.rgb = CARD_BORDER
    tf2 = card_shape_2.text_frame; tf2.word_wrap = True
    p2 = tf2.paragraphs[0]; p2.text = "APPLICATION CORE\n\n• Django 4.2.7 Core\n• REST Framework\n• JWT Stateless Auth\n• post_save Signals\n• CORS Middleware"
    p2.font.name = 'Segoe UI'; p2.font.size = Pt(13); p2.font.color.rgb = TEXT_COLOR
    
    # Block 3: AI Cognitive
    add_card(s3, Inches(5.65), Inches(1.8), Inches(2.2), Inches(4.8), "Cognitive AI", RGBColor(168, 85, 247))
    card_shape_3 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.85), Inches(2.4), Inches(1.8), Inches(3.9))
    card_shape_3.fill.solid(); card_shape_3.fill.fore_color.rgb = CODE_BG; card_shape_3.line.color.rgb = CARD_BORDER
    tf3 = card_shape_3.text_frame; tf3.word_wrap = True
    p3 = tf3.paragraphs[0]; p3.text = "INTELLIGENT LAYER\n\n• Groq SDK\n• Llama 3.3 Engine\n• Function Calling\n• OpenAI API GPT\n• Sentiment Analysis\n• Predictive Insights"
    p3.font.name = 'Segoe UI'; p3.font.size = Pt(13); p3.font.color.rgb = TEXT_COLOR
    
    # Block 4: Data Engine
    add_card(s3, Inches(8.1), Inches(1.8), Inches(2.2), Inches(4.8), "Data & Ingestion", RGBColor(234, 179, 8))
    card_shape_4 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(8.3), Inches(2.4), Inches(1.8), Inches(3.9))
    card_shape_4.fill.solid(); card_shape_4.fill.fore_color.rgb = CODE_BG; card_shape_4.line.color.rgb = CARD_BORDER
    tf4 = card_shape_4.text_frame; tf4.word_wrap = True
    p4 = tf4.paragraphs[0]; p4.text = "ANALYSIS & STORAGE\n\n• SQLite 3 (Dev)\n• PostgreSQL (Prod)\n• Pandas parser\n• openpyxl Engine\n• DB In-memory cache"
    p4.font.name = 'Segoe UI'; p4.font.size = Pt(13); p4.font.color.rgb = TEXT_COLOR
    
    # Block 5: Infrastructure
    add_card(s3, Inches(10.55), Inches(1.8), Inches(2.03), Inches(4.8), "Infrastructure", RGBColor(239, 68, 68))
    card_shape_5 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(10.75), Inches(2.4), Inches(1.63), Inches(3.9))
    card_shape_5.fill.solid(); card_shape_5.fill.fore_color.rgb = CODE_BG; card_shape_5.line.color.rgb = CARD_BORDER
    tf5 = card_shape_5.text_frame; tf5.word_wrap = True
    p5 = tf5.paragraphs[0]; p5.text = "DEPLOYMENT\n\n• Vercel Edge CDN\n• Railway API host\n• Docker runtimes\n• Git CI/CD flows\n• local Windows build"
    p5.font.name = 'Segoe UI'; p5.font.size = Pt(13); p5.font.color.rgb = TEXT_COLOR

    # ==========================================
    # SLIDE 4: Executive Dashboard (Screenshot 012114.png)
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_slide_header(s4, "Executive Dashboard Overview")
    add_ui_image(s4, "Screenshot 2026-07-19 012114.png", Inches(0.75), Inches(1.8), Inches(6.0), Inches(4.8))
    add_card(s4, Inches(7.0), Inches(1.8), Inches(5.58), Inches(4.8), "Metrics & Workflows", TITLE_COLOR)
    s4_points = [
        "How it works: Displays real-time executive indicators (revenue, expense, profit), active items count, pending procurement count, sales volume, and inventory valuations.",
        "Backend/Frontend Attachment: React triggers Axios queries to `/api/dashboard/summary/`. Django aggregates records using ORM (`Sum`, `Count`) and caches variables in memory.",
        "Outcomes: Immediate overview of company solvency, financial position, and quick navigation routes (add sales, adjust stocks, create products)."
    ]
    add_bullet_points(s4, s4_points, Inches(7.2), Inches(2.4), Inches(5.1), Inches(3.9), font_size=14)

    # ==========================================
    # SLIDE 5: Sales Insights Dashboard (Screenshot 012111.png)
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_slide_header(s5, "Sales Performance Insights Dashboard")
    add_ui_image(s5, "Screenshot 2026-07-19 012111.png", Inches(0.75), Inches(1.8), Inches(6.0), Inches(4.8))
    add_card(s5, Inches(7.0), Inches(1.8), Inches(5.58), Inches(4.8), "Interactive Sales Charts", ACCENT_COLOR)
    s5_points = [
        "How it works: Features a dual-axis analytical layout displaying quantities sold by stacked category bars and revenue trends by solid lines.",
        "Backend/Frontend Attachment: Powered by Recharts on the client which queries `/api/dashboard/insights/?period=10`. Backend executes database aggregates grouping transactions by category and date.",
        "Outcomes: Helps managers visual sales demand trends, monitor category velocities, and track profit projections over custom periods."
    ]
    add_bullet_points(s5, s5_points, Inches(7.2), Inches(2.4), Inches(5.1), Inches(3.9), font_size=14)

    # ==========================================
    # SLIDE 6: Accounts & Finance Ledger (Screenshot 012108.png)
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_slide_header(s6, "Accounts & Financial Ledger Module")
    add_ui_image(s6, "Screenshot 2026-07-19 012108.png", Inches(0.75), Inches(1.8), Inches(6.0), Inches(4.8))
    add_card(s6, Inches(7.0), Inches(1.8), Inches(5.58), Inches(4.8), "Double-Entry Financial Auditing", TITLE_COLOR)
    s6_points = [
        "How it works: Organizes financial accounts (Revenues, Expenses, Receivables, Utility Bills) in tabbed lists, displaying gross balances and expandable general journal transactions.",
        "Backend/Frontend Attachment: Queries `/api/accounts/ledger-summary/`. The 'Reconcile Ledger' button triggers backend `/api/accounts/reconcile/` which verifies that the sum of debits equals the sum of credits.",
        "Outcomes: Mathematically balanced company registers, automated transaction ledger trail, and click-to-verify double-entry compliance."
    ]
    add_bullet_points(s6, s6_points, Inches(7.2), Inches(2.4), Inches(5.1), Inches(3.9), font_size=14)

    # ==========================================
    # SLIDE 7: Product Catalog Grid (Screenshot 012102.png)
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    add_slide_header(s7, "Product Catalog & Custom Sections")
    add_ui_image(s7, "Screenshot 2026-07-19 012102.png", Inches(0.75), Inches(1.8), Inches(6.0), Inches(4.8))
    add_card(s7, Inches(7.0), Inches(1.8), Inches(5.58), Inches(4.8), "Metadata Columns & Inventory Sync", ACCENT_COLOR)
    s7_points = [
        "How it works: Renders dynamic product tables grouped by category sections (Beverages, Stationery, Books). Displays SKU, cost, selling price, margin, and stock levels.",
        "Backend/Frontend Attachment: React constructs category filters locally. The `+ Column` tool calls `/api/products/custom-columns/` to alter metadata schemas dynamically without database downtime.",
        "Outcomes: Complete catalog management, automatic updates of cost/sale margins, and instant price syncing across POS checkouts and invoice registers."
    ]
    add_bullet_points(s7, s7_points, Inches(7.2), Inches(2.4), Inches(5.1), Inches(3.9), font_size=14)

    # ==========================================
    # SLIDE 8: Stock Management Dashboard (Screenshot 012055.png)
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    add_slide_header(s8, "Stock Management Control Center")
    add_ui_image(s8, "Screenshot 2026-07-19 012055.png", Inches(0.75), Inches(1.8), Inches(6.0), Inches(4.8))
    add_card(s8, Inches(7.0), Inches(1.8), Inches(5.58), Inches(4.8), "Reorder Threshold Alerts", TITLE_COLOR)
    s8_points = [
        "How it works: Displays total stock values, shop inventory valuations, warehouse counts, low stock lists, and active incoming orders.",
        "Backend/Frontend Attachment: Fetches data from `/api/stock/status/`. Editing the low stock threshold updates the backend rule `/api/stock/settings/` immediately.",
        "Outcomes: Prevents stockouts by flagging low stock items dynamically, updates inventory value, and tracks incoming warehouse logs."
    ]
    add_bullet_points(s8, s8_points, Inches(7.2), Inches(2.4), Inches(5.1), Inches(3.9), font_size=14)

    # ==========================================
    # SLIDE 9: Warehouse & Incoming Stock Modals (Screenshot 012058.png & 012050.png)
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    add_slide_header(s9, "Warehouse Stock & Procurement Modals")
    
    # Double pictures side-by-side or stacked
    add_ui_image(s9, "Screenshot 2026-07-19 012058.png", Inches(0.75), Inches(1.8), Inches(2.9), Inches(4.8))
    add_ui_image(s9, "Screenshot 2026-07-19 012050.png", Inches(3.85), Inches(1.8), Inches(2.9), Inches(4.8))
    
    add_card(s9, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8), "Granular Stock Tracking", ACCENT_COLOR)
    s9_points = [
        "How it works: Details modal windows overlaying the stock dashboard to show product lists filtered by category (Warehouse breakdown) and pending supplier shipments (Incoming breakdown).",
        "Backend/Frontend Attachment: React hooks query `/api/stock/warehouse-breakdown/` and `/api/procurement/pending-breakdown/` views.",
        "Outcomes: Complete routing traceability of product locations, precise pending delivery schedules, and zero-error stock counts."
    ]
    add_bullet_points(s9, s9_points, Inches(7.18), Inches(2.4), Inches(5.2), Inches(3.9), font_size=14)

    # ==========================================
    # SLIDE 10: Sales Transaction Log & Ingestion Suite (Screenshot 012046.png)
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    add_slide_header(s10, "Sales Transactions & Ingestion Suite")
    add_ui_image(s10, "Screenshot 2026-07-19 012046.png", Inches(0.75), Inches(1.8), Inches(6.0), Inches(4.8))
    add_card(s10, Inches(7.0), Inches(1.8), Inches(5.58), Inches(4.8), "Transaction Logging & PDF Upload", TITLE_COLOR)
    s10_points = [
        "How it works: Visualizes daily sales volumes against target benchmarks and lists detailed searchable logs of customer invoice references, product codes, margins, and payment methods.",
        "Backend/Frontend Attachment: Renders paginated listings from `/api/sales/transactions/`. Dragging/uploading sales billing records calls the parser REST API backend.",
        "Outcomes: Searchable logs, historical audit trails, and dynamic data ingestion to update charts and general ledgers automatically."
    ]
    add_bullet_points(s10, s10_points, Inches(7.2), Inches(2.4), Inches(5.1), Inches(3.9), font_size=14)

    # ==========================================
    # SLIDE 11: Supplier Procurement Slips (Screenshot 012037.png)
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    add_slide_header(s11, "Supplier Ordered Slips Management")
    add_ui_image(s11, "Screenshot 2026-07-19 012037.png", Inches(0.75), Inches(1.8), Inches(6.0), Inches(4.8))
    add_card(s11, Inches(7.0), Inches(1.8), Inches(5.58), Inches(4.8), "Procurement Order Cycles", ACCENT_COLOR)
    s11_points = [
        "How it works: Manages supplier order slips, displaying items, ordered/received ratios, costs, and statuses (Pending, Completed, or Partial).",
        "Backend/Frontend Attachment: Frontend calls `/api/procurement/slips/` viewset. Clicking 'Mark Partial' sends a update request to adjust pending quantity balances.",
        "Outcomes: Enables managers to audit procurement deliveries, download generated slip PDFs, and verify received stock before adding it to active inventory."
    ]
    add_bullet_points(s11, s11_points, Inches(7.2), Inches(2.4), Inches(5.1), Inches(3.9), font_size=14)

    # ==========================================
    # SLIDE 12: AI Chatbot Assistant Interface (Screenshot 012026.png)
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    add_slide_header(s12, "AI Chatbot Assistant Interface")
    add_ui_image(s12, "Screenshot 2026-07-19 012026.png", Inches(0.75), Inches(1.8), Inches(6.0), Inches(4.8))
    add_card(s12, Inches(7.0), Inches(1.8), Inches(5.58), Inches(4.8), "Agentic Function Calling Chatbot", TITLE_COLOR)
    s12_points = [
        "How it works: A natural language assistant that answers questions about database records (e.g. sales trends, unpaid invoices, low stock items) and builds visual graphs directly in chat.",
        "Backend/Frontend Attachment: Integrates the Groq API via `/api/chatbot/query/` using RAG. The system exposes tool specifications allowing Llama 3.3 to execute functions locally to query real data.",
        "Outcomes: Instant operational reporting, conversational graphs, and accessible KPI indicators without manually navigating panels."
    ]
    add_bullet_points(s12, s12_points, Inches(7.2), Inches(2.4), Inches(5.1), Inches(3.9), font_size=14)

    # ==========================================
    # SLIDE 13: Direct Stock Purchase (Latest Modification)
    # ==========================================
    s13 = prs.slides.add_slide(blank_layout)
    add_slide_header(s13, "Latest Modification: Direct Stock Purchase")
    
    # We display a code highlight or card detailing the direct purchase modal UI uploaded in user screenshots
    add_card(s13, Inches(0.75), Inches(1.8), Inches(5.6), Inches(4.8), "Operational Direct Stock Input Modal", ACCENT_COLOR)
    feat_points_1 = [
        "Record Stock Instantly: Allows immediate receipt logging when shopkeepers buy stock directly (e.g., calling suppliers rather than ordering through slips).",
        "Two Operational Modes: Supports select from 'Existing Catalog Product' or register 'New Custom Product' directly.",
        "Pack and Cartons Sizing: Dynamically configures 'Pieces Per Pack' to calculate cost per single unit and update inventory counts.",
        "Dynamic Catalog Synchronization: If cost, selling price, or pack sizing are altered on saving, the product catalog entry is automatically updated."
    ]
    add_bullet_points(s13, feat_points_1, Inches(0.95), Inches(2.4), Inches(5.2), Inches(3.9), font_size=14)
    
    add_card(s13, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8), "Dynamic Backend Integration & Outcomes", TITLE_COLOR)
    feat_points_2 = [
        "Double-Entry LEDGER Postings: Atomically credits cash/payable accounts and debits COGS (5010) or Inventory assets upon purchase creation.",
        "Location-Based Routing Signals: Django post-save signals check `delivery_location` to route incoming stock directly to Warehouse or Shop Outlet.",
        "Multi-Choice Search Fallback: If shopkeepers type partial SKU or ID terms (like searching '123' matching 'PEP-BUG-123'), a modal displays matching choices to prevent duplicate entries."
    ]
    add_bullet_points(s13, feat_points_2, Inches(7.18), Inches(2.4), Inches(5.2), Inches(3.9), font_size=14)

    # ==========================================
    # SLIDE 14: Dynamic PDF Invoice Upload Parser
    # ==========================================
    s14 = prs.slides.add_slide(blank_layout)
    add_slide_header(s14, "Latest Modification: AI PDF Invoice Upload")
    
    add_card(s14, Inches(0.75), Inches(1.8), Inches(5.6), Inches(4.8), "AI-Driven Document Extraction", ACCENT_COLOR)
    pdf_points_1 = [
        "Optical Character Recognition (OCR): Parses uploaded PDF invoice documents directly on the client side.",
        "AI Semantic Mapper: Django REST API receives raw text extraction and prompts OpenAI GPT models to map fields (Item Name, SKU, quantities, cost).",
        "Error Tolerant Parsing: Case-insensitive fuzzy matching reconciles scanned names with existing catalog items."
    ]
    add_bullet_points(s14, pdf_points_1, Inches(0.95), Inches(2.4), Inches(5.2), Inches(3.9), font_size=14)
    
    add_card(s14, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8), "Database Automation & Outcomes", TITLE_COLOR)
    pdf_points_2 = [
        "Automatic Stock Entry: Confirms and pushes scanned items directly to inventory (warehouse/shop) using bulk-created ledger signals.",
        "Journal Expense Recognition: Automatically posts the PDF invoice totals as expenses in the Chart of Accounts.",
        "Operational Value: Reduces manual data entry time from 15 minutes per invoice to a single click, eliminating typist errors."
    ]
    add_bullet_points(s14, pdf_points_2, Inches(7.18), Inches(2.4), Inches(5.2), Inches(3.9), font_size=14)

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
    filename = "BizionaryERP_Presentation_v2.pptx"
    prs.save(filename)
    print(f"Presentation saved successfully as {filename}")

if __name__ == '__main__':
    main()
