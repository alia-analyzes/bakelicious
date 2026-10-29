import io
import os
import csv
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(report_data: Dict[str, Any], logo_path: str = None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#8B3246"),
        fontName="Helvetica-Bold"
    )
    
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#64748B")
    )
    
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=12,
        spaceAfter=6
    )

    # Header with Logo & Title
    header_data = []
    title_paragraph = Paragraph("<b>BAKELICIOUS</b><br/><font size=12 color='#64748B'>Business Management Summary Report</font>", title_style)
    
    if logo_path and os.path.exists(logo_path):
        try:
            img = RLImage(logo_path, width=60, height=60)
            header_data.append([img, title_paragraph])
        except Exception:
            header_data.append(["", title_paragraph])
    else:
        header_data.append(["", title_paragraph])

    header_table = Table(header_data, colWidths=[70, 470])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))

    # Meta Info
    period = report_data.get("period", "Custom Range")
    date_str = datetime.now().strftime("%d %b %Y, %I:%M %p")
    story.append(Paragraph(f"<b>Report Period:</b> {period} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Generated On:</b> {date_str}", meta_style))
    story.append(Spacer(1, 15))

    # Summary Metrics Table
    summary = report_data.get("summary", {})
    metrics_table_data = [
        ["Total Orders", "Total Revenue", "Total Expenses", "Gross Profit", "Net Profit"],
        [
            str(summary.get("total_orders", 0)),
            f"₹{summary.get('total_revenue', 0.0):,.2f}",
            f"₹{summary.get('total_expenses', 0.0):,.2f}",
            f"₹{summary.get('gross_profit', 0.0):,.2f}",
            f"₹{summary.get('net_profit', 0.0):,.2f}"
        ]
    ]
    t_metrics = Table(metrics_table_data, colWidths=[100, 110, 110, 110, 110])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#8B3246")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor("#FAF9F6")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,1), (-1,1), 8),
        ('BOTTOMPADDING', (0,1), (-1,1), 8),
    ]))
    story.append(t_metrics)
    story.append(Spacer(1, 20))

    # Top Selling Products Section
    story.append(Paragraph("Best-Selling Products", section_style))
    top_products = report_data.get("top_products", [])
    if top_products:
        prod_table_data = [["Product Name", "Category", "Orders Count", "Total Revenue"]]
        for p in top_products:
            prod_table_data.append([
                p.get("name", "N/A"),
                p.get("category", "General"),
                str(p.get("orders_count", 0)),
                f"₹{p.get('revenue', 0.0):,.2f}"
            ])
        t_prod = Table(prod_table_data, colWidths=[200, 140, 100, 100])
        t_prod.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#334155")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(t_prod)
    else:
        story.append(Paragraph("<i>No product sales recorded for this period.</i>", meta_style))

    story.append(Spacer(1, 20))

    # Low Stock Warnings Section
    story.append(Paragraph("Inventory Warnings (Low Stock)", section_style))
    low_stock = report_data.get("low_stock_items", [])
    if low_stock:
        inv_table_data = [["Ingredient Name", "Category", "Current Stock", "Min Stock"]]
        for item in low_stock:
            inv_table_data.append([
                item.get("name"),
                item.get("category"),
                f"{item.get('quantity')} {item.get('unit')}",
                f"{item.get('min_stock')} {item.get('unit')}"
            ])
        t_inv = Table(inv_table_data, colWidths=[180, 140, 110, 110])
        t_inv.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#991B1B")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#FCA5A5")),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(t_inv)
    else:
        story.append(Paragraph("<i>All inventory ingredients are currently well-stocked.</i>", meta_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def generate_csv_report(orders_data: List[Dict[str, Any]]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Order #", "Client Name", "Delivery Date", "Order Status",
        "Payment Status", "Subtotal (₹)", "Discount (₹)", "Final Amount (₹)", "Advance (₹)", "Remaining (₹)"
    ])
    for o in orders_data:
        writer.writerow([
            o.get("order_number"),
            o.get("client_name"),
            o.get("delivery_date"),
            o.get("order_status"),
            o.get("payment_status"),
            o.get("subtotal"),
            o.get("discount"),
            o.get("final_amount"),
            o.get("advance_paid"),
            o.get("remaining_paid")
        ])
    return output.getvalue()
