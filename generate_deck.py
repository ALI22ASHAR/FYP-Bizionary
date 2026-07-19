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
            tb = slide.shapes.add_textbox(left + Inches(0.15), top + Inches(0.15), width - Inches(0.3), Inches(0.5))
            tf = tb.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = title_text
            p.font.name = 'Segoe UI'
            p.font.size = Pt(18)
            p.font.bold = True
            p.font.color.rgb = title_color
            
        return card

    # Helper to add standard header
    def add_slide_header(slide, title_text, category="BIZIONARY ERP SYSTEM"):
        paint_bg(slide)
        
        # Category label
        cat_tb = slide.shapes.add_textbox(Inches(0.5), Inches(0.2), Inches(12.333), Inches(0.3))
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
        title_tb = slide.shapes.add_textbox(Inches(0.5), Inches(0.45), Inches(12.333), Inches(0.8))
        title_tf = title_tb.text_frame
        title_tf.word_wrap = True
        title_tf.margin_left = title_tf.margin_top = title_tf.margin_bottom = title_tf.margin_right = 0
        title_p = title_tf.paragraphs[0]
        title_p.text = title_text
        title_p.font.name = 'Segoe UI'
        title_p.font.size = Pt(28)
        title_p.font.bold = True
        title_p.font.color.rgb = TITLE_COLOR

    # Helper to add bullet points (Easy English, brief)
    def add_bullet_points(slide, items, left, top, width, height, font_size=13):
        tb = slide.shapes.add_textbox(left, top, width, height)
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_bottom = tf.margin_right = 0
        
        for idx, item in enumerate(items):
            p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
            p.font.name = 'Segoe UI'
            p.font.size = Pt(font_size)
            p.space_after = Pt(4)
            
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
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left - Inches(0.04), top - Inches(0.04), width + Inches(0.08), height + Inches(0.08))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_COLOR
        card.line.color.rgb = ACCENT_COLOR
        card.line.width = Pt(1.5)
        
        image_path = os.path.join(os.getcwd(), "ui pics", image_filename)
        if os.path.exists(image_path):
            slide.shapes.add_picture(image_path, left, top, width, height)
        else:
            tb = slide.shapes.add_textbox(left, top + (height/2) - Inches(0.5), width, Inches(1.0))
            tf = tb.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = f"[Image Missing: {image_filename}]"
            p.alignment = PP_ALIGN.CENTER
            p.font.name = 'Segoe UI'
            p.font.size = Pt(14)
            p.font.color.rgb = RGBColor(239, 68, 68)

    # Helper to draw horizontal flow diagram at the bottom of Right Card
    def add_flow_diagram(slide, left, top, steps):
        x = left
        for i, step in enumerate(steps):
            # Draw Step Rounded Rect
            block = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, top, Inches(1.05), Inches(0.55))
            block.fill.solid()
            block.fill.fore_color.rgb = CODE_BG
            block.line.color.rgb = ACCENT_COLOR
            block.line.width = Pt(1.0)
            
            # Text block inside
            tf = block.text_frame
            tf.word_wrap = True
            tf.margin_left = tf.margin_top = tf.margin_bottom = tf.margin_right = 0
            p = tf.paragraphs[0]
            p.text = step
            p.alignment = PP_ALIGN.CENTER
            p.font.name = 'Segoe UI'
            p.font.size = Pt(8.5)
            p.font.bold = True
            p.font.color.rgb = TEXT_COLOR
            
            x += Inches(1.05)
            
            # Draw arrow if not last step
            if i < len(steps) - 1:
                arrow = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, x + Inches(0.05), top + Inches(0.18), Inches(0.18), Inches(0.2))
                arrow.fill.solid()
                arrow.fill.fore_color.rgb = TITLE_COLOR
                arrow.line.fill.background()
                x += Inches(0.28)

    # ==========================================
    # SLIDE 1: Title & Introduction Slide
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    paint_bg(s1)
    
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
    
    # Bottom columns
    add_card(s1, Inches(0.75), Inches(4.8), Inches(3.7), Inches(1.8), "Corporate Ledgers")
    points_1 = [
        "Relational database schemas.",
        "Double-entry ledger logs.",
        "Automatic stock signals."
    ]
    add_bullet_points(s1, points_1, Inches(0.95), Inches(5.3), Inches(3.3), Inches(1.2), font_size=12)
    
    add_card(s1, Inches(4.8), Inches(4.8), Inches(3.7), Inches(1.8), "AI-Driven Insights")
    points_2 = [
        "Groq Llama 3.3 chatbot.",
        "NLP pricing recommendations.",
        "Stock velocity demand forecast."
    ]
    add_bullet_points(s1, points_2, Inches(5.0), Inches(5.3), Inches(3.3), Inches(1.2), font_size=12)
    
    add_card(s1, Inches(8.85), Inches(4.8), Inches(3.7), Inches(1.8), "Dynamic Ingest")
    points_3 = [
        "Drag & Drop sales PDF upload.",
        "Monthly Excel parser.",
        "Zero-downtime key rotation."
    ]
    add_bullet_points(s1, points_3, Inches(9.05), Inches(5.3), Inches(3.3), Inches(1.2), font_size=12)

    # ==========================================
    # SLIDE 2: Problem & Solution
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_slide_header(s2, "The Problem vs. The Bizionary Solution")
    
    add_card(s2, Inches(0.75), Inches(1.8), Inches(5.6), Inches(4.8), "SME Operational Bottlenecks", RGBColor(239, 68, 68))
    prob_points = [
        "Data Silos: Using paper bills and offline sheets causes inventory mismatch.",
        "No Auditing: Database changes are done without logs, leading to errors.",
        "No Real-time Profit View: Creating financial statements takes weeks.",
        "Bad Restock Habits: Checking stock by hand leads to out-of-stock items."
    ]
    add_bullet_points(s2, prob_points, Inches(0.95), Inches(2.4), Inches(5.2), Inches(3.9), font_size=14)
    
    add_card(s2, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8), "The Integrated Solution", ACCENT_COLOR)
    sol_points = [
        "One Database: Connects Sales, Purchases, Ledgers, and stock in one place.",
        "Auto Journals: Database signals save debit/credit journals automatically.",
        "Sub-Second AI Help: Chatbot queries the live DB to show reports.",
        "Auto-Ingest: Drag-and-drop Excel or PDFs to update inventory quickly."
    ]
    add_bullet_points(s2, sol_points, Inches(7.18), Inches(2.4), Inches(5.2), Inches(3.9), font_size=14)

    # ==========================================
    # SLIDE 3: Tech Stack (Visualization Diagram)
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_slide_header(s3, "Enterprise Technology Stack")
    
    # Grid of card blocks
    add_card(s3, Inches(0.5), Inches(1.8), Inches(2.2), Inches(4.8), "React Client", TITLE_COLOR)
    fe_rect = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.65), Inches(2.4), Inches(1.9), Inches(3.9))
    fe_rect.fill.solid(); fe_rect.fill.fore_color.rgb = CODE_BG; fe_rect.line.color.rgb = CARD_BORDER
    tf1 = fe_rect.text_frame; tf1.word_wrap = True
    p1 = tf1.paragraphs[0]; p1.text = "FRONTEND SPA\n\n• React 19.2 (Vite)\n• Tailwind CSS v4\n• Lucide Icons\n• Recharts graphs\n• jsPDF downloads\n• HTML Canvas"
    p1.font.name = 'Segoe UI'; p1.font.size = Pt(12); p1.font.color.rgb = TEXT_COLOR
    
    add_card(s3, Inches(3.0), Inches(1.8), Inches(2.2), Inches(4.8), "Django Server", ACCENT_COLOR)
    be_rect = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(3.15), Inches(2.4), Inches(1.9), Inches(3.9))
    be_rect.fill.solid(); be_rect.fill.fore_color.rgb = CODE_BG; be_rect.line.color.rgb = CARD_BORDER
    tf2 = be_rect.text_frame; tf2.word_wrap = True
    p2 = tf2.paragraphs[0]; p2.text = "APPLICATION CORE\n\n• Django 4.2.7 Core\n• REST Framework\n• JWT Stateless Auth\n• post_save Signals\n• CORS Middleware"
    p2.font.name = 'Segoe UI'; p2.font.size = Pt(12); p2.font.color.rgb = TEXT_COLOR
    
    add_card(s3, Inches(5.5), Inches(1.8), Inches(2.2), Inches(4.8), "Cognitive AI", RGBColor(168, 85, 247))
    ai_rect = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.65), Inches(2.4), Inches(1.9), Inches(3.9))
    ai_rect.fill.solid(); ai_rect.fill.fore_color.rgb = CODE_BG; ai_rect.line.color.rgb = CARD_BORDER
    tf3 = ai_rect.text_frame; tf3.word_wrap = True
    p3 = tf3.paragraphs[0]; p3.text = "INTELLIGENT LAYER\n\n• Groq SDK\n• Llama 3.3 Engine\n• Function Calling\n• OpenAI API GPT\n• Sentiment Analysis\n• Predictive Insights"
    p3.font.name = 'Segoe UI'; p3.font.size = Pt(12); p3.font.color.rgb = TEXT_COLOR
    
    add_card(s3, Inches(8.0), Inches(1.8), Inches(2.2), Inches(4.8), "Data & Ingestion", RGBColor(234, 179, 8))
    dt_rect = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(8.15), Inches(2.4), Inches(1.9), Inches(3.9))
    dt_rect.fill.solid(); dt_rect.fill.fore_color.rgb = CODE_BG; dt_rect.line.color.rgb = CARD_BORDER
    tf4 = dt_rect.text_frame; tf4.word_wrap = True
    p4 = tf4.paragraphs[0]; p4.text = "ANALYSIS & STORAGE\n\n• SQLite 3 (Local)\n• PostgreSQL (Cloud)\n• Pandas parser\n• openpyxl Engine\n• DB Cache manager"
    p4.font.name = 'Segoe UI'; p4.font.size = Pt(12); p4.font.color.rgb = TEXT_COLOR
    
    add_card(s3, Inches(10.5), Inches(1.8), Inches(2.33), Inches(4.8), "Infrastructure", RGBColor(239, 68, 68))
    inf_rect = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(10.65), Inches(2.4), Inches(2.03), Inches(3.9))
    inf_rect.fill.solid(); inf_rect.fill.fore_color.rgb = CODE_BG; inf_rect.line.color.rgb = CARD_BORDER
    tf5 = inf_rect.text_frame; tf5.word_wrap = True
    p5 = tf5.paragraphs[0]; p5.text = "DEPLOYMENT\n\n• Vercel Edge CDN\n• Railway API host\n• Docker runtimes\n• PyInstaller build\n• Windows standalone"
    p5.font.name = 'Segoe UI'; p5.font.size = Pt(12); p5.font.color.rgb = TEXT_COLOR

    # ==========================================
    # SLIDE 4: Whole Project System Architecture (Visualization Diagram)
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_slide_header(s4, "Project Components & Data Flow Diagram")
    
    # 1. Frontend box
    add_card(s4, Inches(0.5), Inches(2.2), Inches(3.5), Inches(4.0), "1. Frontend (React SPA)", TITLE_COLOR)
    sh_fe = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.65), Inches(2.8), Inches(3.2), Inches(3.2))
    sh_fe.fill.solid(); sh_fe.fill.fore_color.rgb = CODE_BG; sh_fe.line.color.rgb = CARD_BORDER
    tf_fe = sh_fe.text_frame; tf_fe.word_wrap = True
    p_fe = tf_fe.paragraphs[0]; p_fe.text = "Visual Screens:\n• Executive Dashboard\n• POS Scan Form & Ingestion\n• Stock Modals & Calculations\n\nMechanism:\n• Asynchronous Axios clients\n• JWT Bearer Auth tokens"
    p_fe.font.name = 'Segoe UI'; p_fe.font.size = Pt(12); p_fe.font.color.rgb = TEXT_COLOR
    
    # Arrow FE -> BE
    arrow1 = s4.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(4.1), Inches(3.8), Inches(0.7), Inches(0.4))
    arrow1.fill.solid(); arrow1.fill.fore_color.rgb = ACCENT_COLOR; arrow1.line.fill.background()

    # 2. Backend box
    add_card(s4, Inches(4.9), Inches(2.2), Inches(3.5), Inches(4.0), "2. Django REST API", ACCENT_COLOR)
    sh_be = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.05), Inches(2.8), Inches(3.2), Inches(3.2))
    sh_be.fill.solid(); sh_be.fill.fore_color.rgb = CODE_BG; sh_be.line.color.rgb = CARD_BORDER
    tf_be = sh_be.text_frame; tf_be.word_wrap = True
    p_be = tf_be.paragraphs[0]; p_be.text = "Endpoints Viewsets:\n• `/api/dashboard/summary/`\n• `/api/sales/transactions/`\n• `/api/chatbot/query/`\n\nEvent Triggers:\n• Django DB Signals (COGS, cash flows, inventory items mapping)"
    p_be.font.name = 'Segoe UI'; p_be.font.size = Pt(12); p_be.font.color.rgb = TEXT_COLOR
    
    # Arrow BE -> DB & AI
    arrow2 = s4.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(8.5), Inches(3.0), Inches(0.7), Inches(0.4))
    arrow2.fill.solid(); arrow2.fill.fore_color.rgb = ACCENT_COLOR; arrow2.line.fill.background()
    
    arrow3 = s4.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(8.5), Inches(4.6), Inches(0.7), Inches(0.4))
    arrow3.fill.solid(); arrow3.fill.fore_color.rgb = ACCENT_COLOR; arrow3.line.fill.background()

    # 3. DB box
    add_card(s4, Inches(9.3), Inches(1.8), Inches(3.5), Inches(2.2), "3. Relational DB", RGBColor(234, 179, 8))
    sh_db = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(9.45), Inches(2.3), Inches(3.2), Inches(1.5))
    sh_db.fill.solid(); sh_db.fill.fore_color.rgb = CODE_BG; sh_db.line.color.rgb = CARD_BORDER
    tf_db = sh_db.text_frame; tf_db.word_wrap = True
    p_db = tf_db.paragraphs[0]; p_db.text = "• SQLite 3 local storage\n• PostgreSQL database structure\n• Double-entry journal tables"
    p_db.font.name = 'Segoe UI'; p_db.font.size = Pt(11); p_db.font.color.rgb = TEXT_COLOR

    # 4. AI box
    add_card(s4, Inches(9.3), Inches(4.3), Inches(3.5), Inches(2.2), "4. AI Layer (Groq & OpenAI)", RGBColor(168, 85, 247))
    sh_ai = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(9.45), Inches(4.8), Inches(3.2), Inches(1.5))
    sh_ai.fill.solid(); sh_ai.fill.fore_color.rgb = CODE_BG; sh_ai.line.color.rgb = CARD_BORDER
    tf_ai = sh_ai.text_frame; tf_ai.word_wrap = True
    p_ai = tf_ai.paragraphs[0]; p_ai.text = "• Groq Llama 3.3 chatbot agent\n• Local function calling mapping\n• OpenAI sentiment and OCR matching"
    p_ai.font.name = 'Segoe UI'; p_ai.font.size = Pt(11); p_ai.font.color.rgb = TEXT_COLOR

    # ==========================================
    # SLIDE 5: Raw Master Catalog (Al-Noor Trading)
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_slide_header(s5, "Raw Product Master Catalog Data")
    add_ui_image(s5, "media__1784459864365.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s5, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "Product Catalog Excel Sheet", TITLE_COLOR)
    s5_data_points = [
        "Store Master Data: Defines Lahore office product keys, categorizations, and brands.",
        "Key Fields: Includes SKUs, reorder limits, cost values, selling margins, and supplier listings.",
        "System Mapping: The raw Excel contains structural attributes that are parsed into SQL product objects."
    ]
    add_bullet_points(s5, s5_data_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(2.0), font_size=13)
    add_flow_diagram(s5, Inches(8.85), Inches(4.5), ["1. Open Excel", "2. Map Schema", "3. Seed DB"])

    # ==========================================
    # SLIDE 6: Raw 30-Day Sales Data (Al-Noor Trading)
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_slide_header(s6, "Raw 30-Day Monthly Sales Data Sheet")
    add_ui_image(s6, "media__1784459858013.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s6, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "Sales Sheet Columns", ACCENT_COLOR)
    s6_data_points = [
        "Monthly Logs: Stores transaction rows containing margins, reorder units, and stock statuses.",
        "Daily Columns: Tracks unit sales quantities sold day-by-day (from 1-May to 30-May).",
        "Parser Connection: Scans date headers dynamically to index quantities without hardcoded months."
    ]
    add_bullet_points(s6, s6_data_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(2.0), font_size=13)
    add_flow_diagram(s6, Inches(8.85), Inches(4.5), ["1. Read Columns", "2. Parse Quantities", "3. Record Sales"])

    # ==========================================
    # SLIDE 7: Master Data & 6-Month Sales Seeding Flow
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    add_slide_header(s7, "Master Data & 6-Month Sales Seeding")
    
    # Sequence boxes (3 steps)
    add_card(s7, Inches(0.5), Inches(2.0), Inches(3.8), Inches(4.5), "Step 1: Master Catalog Data", TITLE_COLOR)
    st1 = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.65), Inches(2.5), Inches(3.5), Inches(3.8))
    st1.fill.solid(); st1.fill.fore_color.rgb = CODE_BG; st1.line.color.rgb = CARD_BORDER
    t_st1 = st1.text_frame; t_st1.word_wrap = True
    p_st1 = t_st1.paragraphs[0]; p_st1.text = "Initial Data Setup:\n• Exposes real catalogs of items, standard purchase costs, supplier profiles, and categories.\n• Registers items like Beverages, Grocery, Pharmaceuticals, and Stationery.\n• Pre-defines minimum stock thresholds for alert triggers."
    p_st1.font.name = 'Segoe UI'; p_st1.font.size = Pt(13); p_st1.font.color.rgb = TEXT_COLOR
    
    arrow_st1 = s7.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(4.45), Inches(3.8), Inches(0.4), Inches(0.3))
    arrow_st1.fill.solid(); arrow_st1.fill.fore_color.rgb = ACCENT_COLOR; arrow_st1.line.fill.background()

    add_card(s7, Inches(5.0), Inches(2.0), Inches(3.8), Inches(4.5), "Step 2: Seeding Engine", ACCENT_COLOR)
    st2 = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.15), Inches(2.5), Inches(3.5), Inches(3.8))
    st2.fill.solid(); st2.fill.fore_color.rgb = CODE_BG; st2.line.color.rgb = CARD_BORDER
    t_st2 = st2.text_frame; t_st2.word_wrap = True
    p_st2 = t_st2.paragraphs[0]; p_st2.text = "Seeding Logic:\n• Executes script `seed_historical_sales.py` to generate sample logs.\n• Seeds data across multiple calendar months (e.g. January to April 2026).\n• Simulates random order sizes (1-8 pcs) and standard payment methods."
    p_st2.font.name = 'Segoe UI'; p_st2.font.size = Pt(13); p_st2.font.color.rgb = TEXT_COLOR
    
    arrow_st2 = s7.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(8.95), Inches(3.8), Inches(0.4), Inches(0.3))
    arrow_st2.fill.solid(); arrow_st2.fill.fore_color.rgb = ACCENT_COLOR; arrow_st2.line.fill.background()

    add_card(s7, Inches(9.5), Inches(2.0), Inches(3.33), Inches(4.5), "Step 3: Outcome & Analytics", RGBColor(234, 179, 8))
    st3 = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(9.65), Inches(2.5), Inches(3.03), Inches(3.8))
    st3.fill.solid(); st3.fill.fore_color.rgb = CODE_BG; st3.line.color.rgb = CARD_BORDER
    t_st3 = st3.text_frame; t_st3.word_wrap = True
    p_st3 = t_st3.paragraphs[0]; p_st3.text = "Outcome Results:\n• Generates 6 months of sales history representing over 100+ transactions.\n• Populates dashboard insights with real trending sales velocity curves.\n• Enables AI analytics to test demand forecasts, profit summaries, and reorder levels."
    p_st3.font.name = 'Segoe UI'; p_st3.font.size = Pt(13); p_st3.font.color.rgb = TEXT_COLOR

    # ==========================================
    # SLIDE 8: Executive Dashboard (Screenshot 012114.png)
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    add_slide_header(s8, "Executive Dashboard Overview")
    add_ui_image(s8, "Screenshot 2026-07-19 012114.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s8, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "Executive Summary stats", TITLE_COLOR)
    s8_points = [
        "Overview: Displays total sales, expenses, net profits, and inventory value.",
        "Quick Buttons: Easily add products, register suppliers, or log adjustments."
    ]
    add_bullet_points(s8, s8_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(1.5), font_size=13)
    
    # Graphic Flow Diagram
    add_flow_diagram(s8, Inches(8.85), Inches(4.5), ["1. Open Screen", "2. Fetch Stats", "3. Show Dashboard"])

    # ==========================================
    # SLIDE 9: Sales Insights Dashboard (Screenshot 012111.png)
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    add_slide_header(s9, "Sales Performance Insights Dashboard")
    add_ui_image(s9, "Screenshot 2026-07-19 012111.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s9, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "Interactive Sales Charts", ACCENT_COLOR)
    s9_points = [
        "Charts: Shows categories sold (stacked bars) and revenue trends (lines).",
        "Filtering: Toggle days to filter trends instantly."
    ]
    add_bullet_points(s9, s9_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(1.5), font_size=13)
    
    add_flow_diagram(s9, Inches(8.85), Inches(4.5), ["1. Pick Period", "2. Group Dates", "3. Recharts Graph"])

    # ==========================================
    # SLIDE 10: Accounts & Finance Ledger (Screenshot 012108.png)
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    add_slide_header(s10, "Accounts & Financial Ledger Module")
    add_ui_image(s10, "Screenshot 2026-07-19 012108.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s10, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "Double-Entry Audits", TITLE_COLOR)
    s10_points = [
        "Financial Tabs: View Revenues, Expenses, Utility Bills, and statement logs.",
        "Reconciliation: Simple button to verify debits equal credits instantly."
    ]
    add_bullet_points(s10, s10_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(1.5), font_size=13)
    
    add_flow_diagram(s10, Inches(8.85), Inches(4.5), ["1. Log Action", "2. Signals Trigger", "3. Ledger Entry"])

    # ==========================================
    # SLIDE 11: Product Catalog Grid (Screenshot 012102.png)
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    add_slide_header(s11, "Product Catalog & Custom Sections")
    add_ui_image(s11, "Screenshot 2026-07-19 012102.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s11, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "Inventory Catalog System", ACCENT_COLOR)
    s11_points = [
        "Grid List: Shows catalog product SKUs, prices, margins, and active status.",
        "Custom Columns: Create extra fields for specific categories dynamically."
    ]
    add_bullet_points(s11, s11_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(1.5), font_size=13)
    
    add_flow_diagram(s11, Inches(8.85), Inches(4.5), ["1. Add Columns", "2. Alter Schema", "3. Update Tables"])

    # ==========================================
    # SLIDE 12: Stock Management Dashboard (Screenshot 012055.png)
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    add_slide_header(s12, "Stock Management Control Center")
    add_ui_image(s12, "Screenshot 2026-07-19 012055.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s12, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "Reorder Alerts System", TITLE_COLOR)
    s12_points = [
        "Valuations: Tracks shop retail value vs. warehouse stock valuations.",
        "Alerts: Highlights items where stock quantity is below safety limits."
    ]
    add_bullet_points(s12, s12_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(1.5), font_size=13)
    
    add_flow_diagram(s12, Inches(8.85), Inches(4.5), ["1. Check Stock", "2. Compare Limit", "3. Trigger Alert"])

    # ==========================================
    # SLIDE 13: Warehouse & Incoming Stock Modals (Screenshot 012058.png & 012050.png)
    # ==========================================
    s13 = prs.slides.add_slide(blank_layout)
    add_slide_header(s13, "Warehouse Stock & Incoming Modals")
    add_ui_image(s13, "Screenshot 2026-07-19 012058.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s13, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "Stock Locations Reports", ACCENT_COLOR)
    s13_points = [
        "Location Splitting: Traces items inside the warehouse vs. items in shop.",
        "Incoming Orders: List of pending items ordered from supplier shipments."
    ]
    add_bullet_points(s13, s13_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(1.5), font_size=13)
    
    add_flow_diagram(s13, Inches(8.85), Inches(4.5), ["1. Select Item", "2. Query Location", "3. Display Modal"])

    # ==========================================
    # SLIDE 14: Sales Transaction Log & Ingestion Suite (Screenshot 012046.png)
    # ==========================================
    s14 = prs.slides.add_slide(blank_layout)
    add_slide_header(s14, "Sales Transactions & Ingestion Suite")
    add_ui_image(s14, "Screenshot 2026-07-19 012046.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s14, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "Transactions Logging", TITLE_COLOR)
    s14_points = [
        "Logs: Search and filter complete logs of customer sales and margins.",
        "Auto-Ingest: Drag-and-drop Excel sheets to parse transactions quickly."
    ]
    add_bullet_points(s14, s14_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(1.5), font_size=13)
    
    add_flow_diagram(s14, Inches(8.85), Inches(4.5), ["1. Import Sheet", "2. Pandas Parser", "3. Log Sale DB"])

    # ==========================================
    # SLIDE 15: Supplier Ordered Slips (Screenshot 012037.png)
    # ==========================================
    s15 = prs.slides.add_slide(blank_layout)
    add_slide_header(s15, "Supplier Ordered Slips Management")
    add_ui_image(s15, "Screenshot 2026-07-19 012037.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s15, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "Procurement Cycles", ACCENT_COLOR)
    s15_points = [
        "Tracking: Monitor supplier slips, quantities, total sums, and pending statuses.",
        "Stock-in: Easily mark items as received to update inventories immediately."
    ]
    add_bullet_points(s15, s15_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(1.5), font_size=13)
    
    add_flow_diagram(s15, Inches(8.85), Inches(4.5), ["1. Mark Received", "2. Update Slip Ratio", "3. Inflow Stock"])

    # ==========================================
    # SLIDE 16: AI Chatbot Assistant Interface (Screenshot 012026.png)
    # ==========================================
    s16 = prs.slides.add_slide(blank_layout)
    add_slide_header(s16, "AI Chatbot Assistant Interface")
    add_ui_image(s16, "Screenshot 2026-07-19 012026.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s16, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "Agentic AI Chatbot", TITLE_COLOR)
    s16_points = [
        "RAG Agent: Answers questions on invoices, stock alerts, and revenues.",
        "Quick Shortcuts: One-click buttons to check margins or display charts."
    ]
    add_bullet_points(s16, s16_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(1.5), font_size=13)
    
    add_flow_diagram(s16, Inches(8.85), Inches(4.5), ["1. User Prompt", "2. Groq Tool Use", "3. Local Python DB"])

    # ==========================================
    # SLIDE 17: Pack Price Calculator (media__1784456905899.png)
    # ==========================================
    s17 = prs.slides.add_slide(blank_layout)
    add_slide_header(s17, "Pack & Carton Price Calculator")
    add_ui_image(s17, "media__1784456905899.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s17, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "Pack Dynamics Calculator", ACCENT_COLOR)
    s17_points = [
        "Inputs: Configure product single unit selling prices and carton multipliers.",
        "Profit Projections: Displays expected net revenue and margins instantly."
    ]
    add_bullet_points(s17, s17_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(1.5), font_size=13)
    
    add_flow_diagram(s17, Inches(8.85), Inches(4.5), ["1. Enter Quantity", "2. React State", "3. Compute Profit"])

    # ==========================================
    # SLIDE 18: Direct Stock Purchase (media__1784456944788.png)
    # ==========================================
    s18 = prs.slides.add_slide(blank_layout)
    add_slide_header(s18, "Direct Stock Purchase (Latest Modification)")
    add_ui_image(s18, "media__1784456944788.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s18, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "Direct Inflow Ledger Entries", TITLE_COLOR)
    s18_points = [
        "Stock Intake: Log supplier purchases directly to shop or warehouse stock.",
        "Custom Pack Sizes: Input unit cost and packs to update catalogs."
    ]
    add_bullet_points(s18, s18_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(1.5), font_size=13)
    
    add_flow_diagram(s18, Inches(8.85), Inches(4.5), ["1. Select Product", "2. Route Location", "3. Signal Stock In"])

    # ==========================================
    # SLIDE 19: AI Sales Slip PDF Upload (media__1784457199782.png)
    # ==========================================
    s19 = prs.slides.add_slide(blank_layout)
    add_slide_header(s19, "AI Sales Slip PDF Upload / Bulk Sale")
    add_ui_image(s19, "media__1784457199782.png", Inches(0.5), Inches(1.8), Inches(8.0), Inches(4.8))
    add_card(s19, Inches(8.7), Inches(1.8), Inches(4.13), Inches(4.8), "AI-Driven Parser Modal", ACCENT_COLOR)
    s19_points = [
        "Upload PDF: Extracts item name, quantities, and cost automatically.",
        "Fuzzy Matcher: AI maps scanned invoice details to existing catalog SKUs."
    ]
    add_bullet_points(s19, s19_points, Inches(8.85), Inches(2.4), Inches(3.8), Inches(1.5), font_size=13)
    
    add_flow_diagram(s19, Inches(8.85), Inches(4.5), ["1. Upload File", "2. OpenAI Extract", "3. Record Sales DB"])

    # ==========================================
    # SLIDE 20: Standalone Desktop Executable (.exe)
    # ==========================================
    s20 = prs.slides.add_slide(blank_layout)
    add_slide_header(s20, "Standalone Desktop Executable (.exe)")
    
    # 3 sequence blocks for compilation pipeline
    add_card(s20, Inches(0.5), Inches(2.0), Inches(3.8), Inches(4.5), "Vite React Compilation", TITLE_COLOR)
    exe_c1 = s20.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.65), Inches(2.5), Inches(3.5), Inches(3.8))
    exe_c1.fill.solid(); exe_c1.fill.fore_color.rgb = CODE_BG; exe_c1.line.color.rgb = CARD_BORDER
    tf_c1 = exe_c1.text_frame; tf_c1.word_wrap = True
    p_c1 = tf_c1.paragraphs[0]; p_c1.text = "Step 1: Frontend Build:\n• Cleans former build outputs.\n• Bundles static HTML, CSS, and JS components using Vite compiler.\n• Optimizes asset trees to generate single-page static distribution directories."
    p_c1.font.name = 'Segoe UI'; p_c1.font.size = Pt(13); p_c1.font.color.rgb = TEXT_COLOR
    
    arrow_c1 = s20.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(4.45), Inches(3.8), Inches(0.4), Inches(0.3))
    arrow_c1.fill.solid(); arrow_c1.fill.fore_color.rgb = ACCENT_COLOR; arrow_c1.line.fill.background()

    add_card(s20, Inches(5.0), Inches(2.0), Inches(3.8), Inches(4.5), "Django Ledger Migration", ACCENT_COLOR)
    exe_c2 = s20.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.15), Inches(2.5), Inches(3.5), Inches(3.8))
    exe_c2.fill.solid(); exe_c2.fill.fore_color.rgb = CODE_BG; exe_c2.line.color.rgb = CARD_BORDER
    tf_c2 = exe_c2.text_frame; tf_c2.word_wrap = True
    p_c2 = tf_c2.paragraphs[0]; p_c2.text = "Step 2: Database Preparation:\n• Runs Django model checkups and applies migrations to build a blank SQLite database schema.\n• Collects static bundles using python command-line scripts."
    p_c2.font.name = 'Segoe UI'; p_c2.font.size = Pt(13); p_c2.font.color.rgb = TEXT_COLOR
    
    arrow_c2 = s20.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(8.95), Inches(3.8), Inches(0.4), Inches(0.3))
    arrow_c2.fill.solid(); arrow_c2.fill.fore_color.rgb = ACCENT_COLOR; arrow_c2.line.fill.background()

    add_card(s20, Inches(9.5), Inches(2.0), Inches(3.33), Inches(4.5), "PyInstaller Executable", RGBColor(234, 179, 8))
    exe_c3 = s20.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(9.65), Inches(2.5), Inches(3.03), Inches(3.8))
    exe_c3.fill.solid(); exe_c3.fill.fore_color.rgb = CODE_BG; exe_c3.line.color.rgb = CARD_BORDER
    tf_c3 = exe_c3.text_frame; tf_c3.word_wrap = True
    p_c3 = tf_c3.paragraphs[0]; p_c3.text = "Step 3: Packaged Binary:\n• Invokes PyInstaller compiler wrapping `run_server.py` and embedding Python DLLs and sqlite schemas.\n• Generates a standalone double-clickable `BizionaryERP_Windows.zip` archive containing the local runner."
    p_c3.font.name = 'Segoe UI'; p_c3.font.size = Pt(13); p_c3.font.color.rgb = TEXT_COLOR

    # ==========================================
    # SLIDE 21: Data Portability & Disaster Recovery
    # ==========================================
    s21 = prs.slides.add_slide(blank_layout)
    add_slide_header(s21, "Data Portability & Porting")
    
    add_card(s21, Inches(0.75), Inches(1.8), Inches(5.6), Inches(4.8), "Self-Contained SQLite Backups", TITLE_COLOR)
    port_points_1 = [
        "Database Portability: All records (products, transactions, cash flows, user credentials) are saved in a single, robust file named `db.sqlite3`.",
        "Physical Isolation: The database resides inside the `_internal` subdirectory of the compiled standalone package.",
        "Simple Copy-Paste Backup: Users can back up their entire store database by making a duplicate copy of `db.sqlite3`."
    ]
    add_bullet_points(s21, port_points_1, Inches(1.0), Inches(2.4), Inches(5.1), Inches(3.8), font_size=16)
    
    add_card(s21, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8), "Procedure for Updating System", ACCENT_COLOR)
    port_points_2 = [
        "1. Copy Old DB: Go to the old folder and copy `BizionaryERP/_internal/db.sqlite3`.",
        "2. Extract New Version: Extract the updated compiled zip package.",
        "3. Replace Template: Paste the copied `db.sqlite3` file into the new `_internal` directory, replacing the blank database.",
        "4. Run Launcher: Double-click the launch script; all historical records will load immediately."
    ]
    add_bullet_points(s21, port_points_2, Inches(7.23), Inches(2.4), Inches(5.1), Inches(3.8), font_size=16)

    # ==========================================
    # SLIDE 22: Future Enhancements
    # ==========================================
    s22 = prs.slides.add_slide(blank_layout)
    add_slide_header(s22, "Future Enhancements")
    
    add_card(s22, Inches(0.75), Inches(1.8), Inches(11.83), Inches(4.8), "Scalability & Product Roadmap", ACCENT_COLOR)
    future_points = [
        "Multi-Tenant SaaS Support: Transition the current single-enterprise design to support multi-tenant user bases, permitting multiple businesses to register and manage their operations independently.",
        "Hardware Integration: Build direct interfaces for POS peripheral devices, including barcode scanners, receipt thermal printers, and electronic cash drawers.",
        "Automated Notifications Pipeline: Connect SMS (Twilio) and Email (SendGrid) triggers to dynamically alert suppliers on low stock, send invoice reminders to customers, and email managers financial summaries.",
        "Extended AI Capabilities: Build deep learning models for advanced predictive demand forecasting based on external seasonal events, market trends, and historic data."
    ]
    add_bullet_points(s22, future_points, Inches(1.0), Inches(2.4), Inches(11.33), Inches(3.9), font_size=16)

    # ==========================================
    # SLIDE 23: Thank You & Q&A
    # ==========================================
    s23 = prs.slides.add_slide(blank_layout)
    paint_bg(s23)
    
    tb = s23.shapes.add_textbox(Inches(0.75), Inches(2.5), Inches(11.833), Inches(3.0))
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
    filename = "BizionaryERP_Presentation_v5.pptx"
    prs.save(filename)
    print(f"Presentation saved successfully as {filename}")

if __name__ == '__main__':
    main()
