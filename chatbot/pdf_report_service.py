import io
import os
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Q

from invoices.models import Invoice
from purchases.models import Purchase
from products.models import Product

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to draw running headers, running footers, and page numbers dynamically.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor('#64748B'))
        
        # Draw running header on page > 1
        if self._pageNumber > 1:
            self.drawString(36, 756, "BIZIONARY ERP - Invoices Executive Analysis Report")
            self.setStrokeColor(colors.HexColor('#CBD5E1'))
            self.setLineWidth(0.5)
            self.line(36, 748, 576, 748)
            
        # Draw running footer on all pages
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 36, page_text)
        self.drawString(36, 36, "CONFIDENTIAL - Bizionary ERP AI Agent Generated Report")
        self.setStrokeColor(colors.HexColor('#CBD5E1'))
        self.setLineWidth(0.5)
        self.line(36, 48, 576, 48)
        
        self.restoreState()


def get_heuristic_analysis(sales_summary, stock_summary):
    """
    Standard professional business analysis generated using heuristics as a fallback.
    """
    inflow = sales_summary['paid']
    outflow = stock_summary['paid']
    net = inflow - outflow
    
    analysis = (
        f"Based on the live database records, the company has processed {sales_summary['count']} sales invoices totaling "
        f"Rs. {sales_summary['total']:,.2f} and {stock_summary['count']} stock invoices (procurement receipts) totaling "
        f"Rs. {stock_summary['total']:,.2f}.\n\n"
    )
    
    analysis += "1. Cash Flow Dynamics: "
    if net > 0:
        analysis += (
            f"The company shows a positive net cash balance of Rs. {net:,.2f} from invoice collections (Rs. {inflow:,.2f} "
            f"received vs Rs. {outflow:,.2f} paid out to suppliers). This indicates a healthy operational cash position, "
            f"covering stock acquisition outlays directly with invoice cash receipts."
        )
    else:
        analysis += (
            f"The company has a negative cash gap of Rs. {abs(net):,.2f} (Rs. {inflow:,.2f} collected vs Rs. {outflow:,.2f} "
            f"paid out). Outlays for stock procurement currently exceed sales collections, which indicates that working "
            f"capital is heavily invested in product restocking and inventory acquisition."
        )
    analysis += "\n\n"
        
    analysis += "2. Outstanding Balances & Collection Risks: "
    analysis += (
        f"Customers owe an outstanding balance of Rs. {sales_summary['due']:,.2f} (Collection Rate: {sales_summary['rate']:.1f}%), "
        f"representing cash currently tied up in receivables. Meanwhile, the company owes suppliers Rs. {stock_summary['due']:,.2f} "
        f"(Payment Rate: {stock_summary['rate']:.1f}%) in unpaid stock procurement receipts. Releasing collections is vital to "
        f"clear outstanding payables safely."
    )
    analysis += "\n\n"
    
    analysis += "3. Strategic Recommendations:\n"
    analysis += "• Collection Acceleration: Implement systematic follow-ups and billing terms review to recover the outstanding customer balances.\n"
    analysis += "• Supplier Term Negotiations: Attempt to negotiate extended payment windows (e.g. Net-30 terms) with key suppliers to protect cash reserves.\n"
    analysis += "• Reorder Calibration: Verify current stock velocities against procurement cycles to avoid over-purchasing and locking cash in low-velocity stock."
    
    return analysis


def get_ai_analysis(sales_summary, stock_summary):
    """
    Generate dynamic NLP narrative summarizing the sales invoices and stock invoices using the active LLM key.
    """
    from accounts.api_config_utils import get_active_api_key
    import httpx
    import os
    
    prompt = f"""
You are an expert NLP Engineer and Senior Business Analyst at Bizionary ERP.
Your task is to generate a human-friendly executive analysis of the company's Sales Invoices and Stock Invoices (Procurements).

Here is the compiled data for the analysis:

[SALES INVOICES (Client Billings)]
- Total Invoices: {sales_summary['count']}
- Total Billing Value: Rs. {sales_summary['total']:,.2f}
- Total Amount Collected: Rs. {sales_summary['paid']:,.2f}
- Outstanding Balance due: Rs. {sales_summary['due']:,.2f}
- Collection Rate: {sales_summary['rate']:.1f}%

[STOCK INVOICES (Supplier Procurements)]
- Total Stock Invoices: {stock_summary['count']}
- Total Procurement Cost: Rs. {stock_summary['total']:,.2f}
- Paid to Suppliers: Rs. {stock_summary['paid']:,.2f}
- Outstanding Payables: Rs. {stock_summary['due']:,.2f}
- Payment Rate: {stock_summary['rate']:.1f}%

Please write a structured, human-friendly summary (approx 200-250 words) with the following sections:
1. Cash Flow Dynamics: Compare sales revenue collection vs stock purchase outlays. Explain the cash flow health.
2. Outstanding Receivables & Payables: Analyze unpaid items, highlighting if there is a collection risk or supplier bottleneck.
3. Actionable Recommendations: Provide 2-3 specific, strategic recommendations (e.g. accelerating collections, renegotiating terms, or optimizing stock reorders).

Write the response in standard paragraphs. Do not use Markdown styling headers (like ### or ##) because the text will be parsed directly into PDF Paragraph blocks. Use bullet points if needed. Do not use bold tags like ** inside sentences. Keep the tone highly professional, analytical, and direct.
"""
    
    # Try Groq first
    api_key = get_active_api_key(provider='groq')
    if api_key:
        try:
            from groq import Groq
            client = Groq(api_key=api_key, http_client=httpx.Client())
            model = os.environ.get('GROQ_MODEL', 'llama-3.3-70b-versatile')
            
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a professional ERP business analyst."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=600
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error calling Groq for PDF report AI analysis: {e}")
            
    # Try OpenAI as fallback
    openai_key = get_active_api_key(provider='openai')
    if openai_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key, http_client=httpx.Client())
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional ERP business analyst."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=600
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error calling OpenAI for PDF report AI analysis: {e}")
            
    # Heuristic fallback if no keys or API call fails
    return get_heuristic_analysis(sales_summary, stock_summary)


def generate_sales_stock_pdf_report(start_date=None, end_date=None):
    """
    Query all sales invoices & stock invoices, trigger NLP analysis, and write ReportLab PDF report bytes.
    """
    # 1. Filter Sales Invoices and Stock Invoices (Purchases)
    invoices_qs = Invoice.objects.all()
    purchases_qs = Purchase.objects.select_related('product').all()
    
    if start_date:
        invoices_qs = invoices_qs.filter(invoice_date__gte=start_date)
        purchases_qs = purchases_qs.filter(purchase_date__gte=start_date)
    if end_date:
        invoices_qs = invoices_qs.filter(invoice_date__lte=end_date)
        purchases_qs = purchases_qs.filter(purchase_date__lte=end_date)
        
    invoices = list(invoices_qs.order_by('-invoice_date'))
    purchases = list(purchases_qs.order_by('-purchase_date'))
    
    # 2. Compute Sales Invoice statistics
    total_sales_count = len(invoices)
    total_sales_value = sum(inv.total_amount for inv in invoices) if invoices else Decimal('0.00')
    total_sales_paid = sum(inv.amount_paid for inv in invoices) if invoices else Decimal('0.00')
    total_sales_due = sum(inv.balance_due for inv in invoices) if invoices else Decimal('0.00')
    collection_rate = (float(total_sales_paid) / float(total_sales_value) * 100) if total_sales_value > 0 else 0.0
    
    # 3. Compute Stock Procurement statistics (payments are inferred from status)
    total_stock_count = len(purchases)
    total_stock_cost = sum(p.total_cost for p in purchases) if purchases else Decimal('0.00')
    total_stock_paid = Decimal('0.00')
    for p in purchases:
        if p.payment_status == 'PAID':
            total_stock_paid += p.total_cost
        elif p.payment_status == 'PARTIAL':
            total_stock_paid += p.total_cost / 2
    total_stock_due = total_stock_cost - total_stock_paid
    stock_payment_rate = (float(total_stock_paid) / float(total_stock_cost) * 100) if total_stock_cost > 0 else 0.0
    
    # 4. Invoke NLP Engine
    sales_summary = {
        'count': total_sales_count,
        'total': float(total_sales_value),
        'paid': float(total_sales_paid),
        'due': float(total_sales_due),
        'rate': collection_rate
    }
    
    stock_summary = {
        'count': total_stock_count,
        'total': float(total_stock_cost),
        'paid': float(total_stock_paid),
        'due': float(total_stock_due),
        'rate': stock_payment_rate
    }
    
    ai_narrative = get_ai_analysis(sales_summary, stock_summary)
    
    # 5. Build PDF Layout in Memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom PDF Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#FFFFFF'),
        alignment=TA_LEFT
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#F8FAFC'),
        alignment=TA_LEFT
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=6,
        spaceBefore=14,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=5
    )
    
    table_text_style = ParagraphStyle(
        'TableText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#334155')
    )
    
    table_text_right = ParagraphStyle(
        'TableTextRight',
        parent=table_text_style,
        alignment=TA_RIGHT
    )
    
    table_text_bold = ParagraphStyle(
        'TableTextBold',
        parent=table_text_style,
        fontName='Helvetica-Bold'
    )
    
    table_text_bold_right = ParagraphStyle(
        'TableTextBoldRight',
        parent=table_text_bold,
        alignment=TA_RIGHT
    )
    
    card_title_style = ParagraphStyle(
        'CardTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#64748B'),
        alignment=TA_CENTER
    )
    
    card_value_style = ParagraphStyle(
        'CardValue',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#1E293B'),
        alignment=TA_CENTER
    )
    
    story = []
    
    # Header Banner Table
    banner_data = [
        [
            Paragraph("BIZIONARY ERP", title_style),
            Paragraph(f"<b>REPORT DATE:</b> {timezone.localtime().strftime('%B %d, %Y')}<br/><b>FILTER:</b> {f'{start_date} to {end_date}' if start_date or end_date else 'All Live Data'}", subtitle_style)
        ],
        [
            Paragraph("Sales & Stock Invoices Executive Analysis Report", subtitle_style),
            Paragraph("Generated by AI Agentic Analyst", subtitle_style)
        ]
    ]
    banner_table = Table(banner_data, colWidths=[310, 230])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1E293B')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,0), 1),
        ('TOPPADDING', (0,1), (-1,1), 1),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 12))
    
    # Key Summary Cards (3 Columns)
    kpi_data = [
        [
            Paragraph("TOTAL SALES BILLING", card_title_style),
            Paragraph("TOTAL PROCUREMENT", card_title_style),
            Paragraph("NET INFLOW POSITION", card_title_style)
        ],
        [
            Paragraph(f"Rs. {total_sales_value:,.2f}<br/><font color='#64748B' size=6.5>Collected: Rs. {total_sales_paid:,.2f}</font>", card_value_style),
            Paragraph(f"Rs. {total_stock_cost:,.2f}<br/><font color='#64748B' size=6.5>Paid: Rs. {total_stock_paid:,.2f}</font>", card_value_style),
            Paragraph(f"Rs. {total_sales_paid - total_stock_paid:,.2f}<br/><font color='#64748B' size=6.5>Collections vs Procurements</font>", card_value_style)
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[180, 180, 180])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('BOTTOMPADDING', (0,1), (-1,1), 6),
        ('LINELEFT', (0,0), (0,-1), 3, colors.HexColor('#3B82F6')), # Blue for sales
        ('LINELEFT', (1,0), (1,-1), 3, colors.HexColor('#A6764F')), # Brown for stock
        ('LINELEFT', (2,0), (2,-1), 3, colors.HexColor('#10B981')), # Green for net
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 10))
    
    # AI Executive Narrative Callout Box
    story.append(Paragraph("1. EXECUTIVE AI SUMMARY & BUSINESS RECOMMENDATIONS", h1_style))
    ai_paragraphs = ai_narrative.split('\n\n')
    ai_elements = []
    for p_text in ai_paragraphs:
        p_text = p_text.replace('\n', '<br/>')
        ai_elements.append(Paragraph(p_text, body_style))
        ai_elements.append(Spacer(1, 3))
        
    ai_table_data = [[ai_elements]]
    ai_table = Table(ai_table_data, colWidths=[540])
    ai_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('LINELEFT', (0,0), (-1,-1), 3, colors.HexColor('#A6764F')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(ai_table)
    story.append(Spacer(1, 12))
    
    # Sales Invoices Section
    story.append(Paragraph(f"2. SALES INVOICES LEDGER ({len(invoices)} Invoices)", h1_style))
    
    # Sales Table
    sales_table_data = [[
        Paragraph("<b>Invoice #</b>", table_text_bold),
        Paragraph("<b>Date</b>", table_text_bold),
        Paragraph("<b>Customer Name</b>", table_text_bold),
        Paragraph("<b>Total Amount</b>", table_text_bold_right),
        Paragraph("<b>Amount Paid</b>", table_text_bold_right),
        Paragraph("<b>Balance Due</b>", table_text_bold_right),
        Paragraph("<b>Status</b>", table_text_bold)
    ]]
    
    for inv in invoices[:20]:  # Limit rows to fit nicely in 2-3 pages
        status_color = '#10B981' if inv.status == 'PAID' else ('#EF4444' if inv.status == 'OVERDUE' else '#F59E0B')
        status_para = Paragraph(f"<font color='{status_color}'><b>{inv.status}</b></font>", table_text_bold)
        
        sales_table_data.append([
            Paragraph(inv.invoice_number, table_text_bold),
            Paragraph(str(inv.invoice_date), table_text_style),
            Paragraph(inv.customer_name, table_text_style),
            Paragraph(f"Rs. {inv.total_amount:,.2f}", table_text_right),
            Paragraph(f"Rs. {inv.amount_paid:,.2f}", table_text_right),
            Paragraph(f"Rs. {inv.balance_due:,.2f}", table_text_right),
            status_para
        ])
        
    if invoices:
        sales_table_data.append([
            Paragraph("<b>TOTALS</b>", table_text_bold),
            Paragraph("", table_text_style),
            Paragraph("", table_text_style),
            Paragraph(f"<b>Rs. {total_sales_value:,.2f}</b>", table_text_bold_right),
            Paragraph(f"<b>Rs. {total_sales_paid:,.2f}</b>", table_text_bold_right),
            Paragraph(f"<b>Rs. {total_sales_due:,.2f}</b>", table_text_bold_right),
            Paragraph(f"<b>{collection_rate:.1f}% Coll.</b>", table_text_bold)
        ])
        
    sales_table = Table(sales_table_data, colWidths=[70, 65, 130, 85, 75, 75, 40])
    sales_table_style = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,0), 5),
        ('TOPPADDING', (0,0), (-1,0), 5),
    ]
    for i in range(1, len(sales_table_data) - 1):
        if i % 2 == 0:
            sales_table_style.append(('BACKGROUND', (0,i), (-1,i), colors.HexColor('#F8FAFC')))
    if invoices:
        sales_table_style.append(('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#F1F5F9')))
        sales_table_style.append(('LINEABOVE', (0,-1), (-1,-1), 1, colors.HexColor('#CBD5E1')))
        
    sales_table.setStyle(TableStyle(sales_table_style))
    story.append(sales_table)
    story.append(Spacer(1, 12))
    
    # Stock Procurement Invoices Section
    story.append(Paragraph(f"3. STOCK PROCUREMENT INVOICES ({len(purchases)} Receipts)", h1_style))
    
    # Procurement Table
    stock_table_data = [[
        Paragraph("<b>PO Ref</b>", table_text_bold),
        Paragraph("<b>Date</b>", table_text_bold),
        Paragraph("<b>Supplier</b>", table_text_bold),
        Paragraph("<b>Product</b>", table_text_bold),
        Paragraph("<b>Qty</b>", table_text_bold_right),
        Paragraph("<b>Total Cost</b>", table_text_bold_right),
        Paragraph("<b>Payment</b>", table_text_bold)
    ]]
    
    for p in purchases[:20]:
        ref_label = f"PO-{str(p.id).zfill(4)}"
        pay_color = '#10B981' if p.payment_status == 'PAID' else ('#EF4444' if p.payment_status == 'UNPAID' else '#F59E0B')
        pay_para = Paragraph(f"<font color='{pay_color}'><b>{p.payment_status}</b></font>", table_text_bold)
        
        stock_table_data.append([
            Paragraph(ref_label, table_text_bold),
            Paragraph(str(p.purchase_date), table_text_style),
            Paragraph(p.company_name, table_text_style),
            Paragraph(p.product.name if p.product else "Unknown", table_text_style),
            Paragraph(str(p.quantity_purchased), table_text_right),
            Paragraph(f"Rs. {p.total_cost:,.2f}", table_text_right),
            pay_para
        ])
        
    if purchases:
        stock_table_data.append([
            Paragraph("<b>TOTALS</b>", table_text_bold),
            Paragraph("", table_text_style),
            Paragraph("", table_text_style),
            Paragraph("", table_text_style),
            Paragraph(str(sum(p.quantity_purchased for p in purchases)), table_text_bold_right),
            Paragraph(f"<b>Rs. {total_stock_cost:,.2f}</b>", table_text_bold_right),
            Paragraph(f"<b>{stock_payment_rate:.1f}% Paid</b>", table_text_bold)
        ])
        
    stock_table = Table(stock_table_data, colWidths=[55, 65, 110, 140, 40, 80, 50])
    stock_table_style = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,0), 5),
        ('TOPPADDING', (0,0), (-1,0), 5),
    ]
    for i in range(1, len(stock_table_data) - 1):
        if i % 2 == 0:
            stock_table_style.append(('BACKGROUND', (0,i), (-1,i), colors.HexColor('#F8FAFC')))
    if purchases:
        stock_table_style.append(('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#F1F5F9')))
        stock_table_style.append(('LINEABOVE', (0,-1), (-1,-1), 1, colors.HexColor('#CBD5E1')))
        
    stock_table.setStyle(TableStyle(stock_table_style))
    story.append(stock_table)
    
    # Critical Reorder Warnings (Keep together)
    low_products = list(Product.objects.filter(stock_quantity__lte=20, status='ACTIVE').order_by('stock_quantity')[:10])
    if low_products:
        story.append(Spacer(1, 12))
        reorder_elements = []
        reorder_elements.append(Paragraph("4. CRITICAL REORDER & STOCK WARNINGS", h1_style))
        
        reorder_table_data = [[
            Paragraph("<b>SKU</b>", table_text_bold),
            Paragraph("<b>Product Name</b>", table_text_bold),
            Paragraph("<b>Current Stock</b>", table_text_bold_right),
            Paragraph("<b>Min Threshold</b>", table_text_bold_right),
            Paragraph("<b>Status</b>", table_text_bold)
        ]]
        
        for p in low_products:
            warning_color = '#EF4444' if p.stock_quantity <= 0 else '#F59E0B'
            status_para = Paragraph(f"<font color='{warning_color}'><b>{p.stock_status}</b></font>", table_text_bold)
            
            reorder_table_data.append([
                Paragraph(p.sku, table_text_style),
                Paragraph(p.name, table_text_style),
                Paragraph(str(p.stock_quantity), table_text_right),
                Paragraph(str(p.min_stock), table_text_right),
                status_para
            ])
            
        reorder_table = Table(reorder_table_data, colWidths=[80, 240, 80, 80, 60])
        reorder_table_style = [
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FFEBEB')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#FFC1C1')),
            ('PADDING', (0,0), (-1,-1), 4),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]
        for i in range(1, len(reorder_table_data)):
            if i % 2 == 0:
                reorder_table_style.append(('BACKGROUND', (0,i), (-1,i), colors.HexColor('#FFF5F5')))
                
        reorder_table.setStyle(TableStyle(reorder_table_style))
        reorder_elements.append(reorder_table)
        story.append(KeepTogether(reorder_elements))
        
    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    
    # Get PDF bytes and return
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
