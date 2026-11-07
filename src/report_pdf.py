"""Build the sample State Government Trends Insights Report PDF.

Every figure is an example index. Nothing in the file is a real spend,
award, price, or vendor result.
"""
import os
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, PageBreak,
    Paragraph, Spacer, Table, TableStyle, ListFlowable, ListItem,
)
from reportlab.graphics.shapes import Drawing, String, Rect
from reportlab.graphics.charts.barcharts import VerticalBarChart

NAVY = HexColor("#0b1f3a")
TEAL = HexColor("#0e7490")
CYAN = HexColor("#22d3ee")
INK = HexColor("#0b1426")
MUTED = HexColor("#475569")
SOFT = HexColor("#f3f8fb")
LINE = HexColor("#d5e2ea")
AMBER = HexColor("#fff7e6")
AMBER_LINE = HexColor("#f5c26b")
BANNER = "SAMPLE — ILLUSTRATIVE DATA, NOT ACTUAL FIGURES"

def _styles():
    s = {}
    s["h1"] = ParagraphStyle("h1", fontName="Times-Bold", fontSize=22, leading=26, textColor=NAVY, spaceAfter=8)
    s["h2"] = ParagraphStyle("h2", fontName="Times-Bold", fontSize=14, leading=18, textColor=TEAL, spaceBefore=2, spaceAfter=6)
    s["body"] = ParagraphStyle("body", fontName="Times-Roman", fontSize=10.5, leading=14, textColor=INK, spaceAfter=8)
    s["small"] = ParagraphStyle("small", fontName="Times-Italic", fontSize=8.5, leading=11, textColor=MUTED, spaceBefore=2, spaceAfter=8)
    s["cover_kicker"] = ParagraphStyle("ck", fontName="Times-Bold", fontSize=9, leading=12, textColor=TEAL)
    s["li"] = ParagraphStyle("li", fontName="Times-Roman", fontSize=10.5, leading=14, textColor=INK)
    return s

def _bar(names, series, series_names, ymax=100, ymin=0, width=500, height=196):
    d = Drawing(width, height)
    d.add(Rect(0, 0, width, height, fillColor=SOFT, strokeColor=LINE, strokeWidth=0.4))
    bc = VerticalBarChart()
    bc.x = 42
    bc.y = 28
    bc.height = height - 52
    bc.width = width - 58
    bc.data = series
    bc.categoryAxis.categoryNames = names
    bc.categoryAxis.labels.fontName = "Times-Roman"
    bc.categoryAxis.labels.fontSize = 8
    bc.categoryAxis.labels.fillColor = INK
    bc.valueAxis.valueMin = ymin
    bc.valueAxis.valueMax = ymax
    step = (ymax - ymin) / 4
    bc.valueAxis.valueStep = step if step else 1
    bc.valueAxis.labels.fontName = "Times-Roman"
    bc.valueAxis.labels.fontSize = 8
    bc.valueAxis.labels.fillColor = MUTED
    bc.groupSpacing = 10
    bc.barSpacing = 2
    bc.bars[0].fillColor = TEAL
    if len(series) > 1:
        bc.bars[1].fillColor = CYAN
    if len(series) > 2:
        bc.bars[2].fillColor = NAVY
    d.add(bc)
    d.add(String(46, height - 14, "  ·  ".join(series_names), fontName="Times-Italic", fontSize=8, fillColor=MUTED))
    return d

def _table(headers, rows):
    data = [headers] + rows
    sty = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Times-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Times-Roman"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("TEXTCOLOR", (0, 1), (-1, -1), INK),
        ("BACKGROUND", (0, 1), (-1, -1), white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SOFT]),
        ("GRID", (0, 0), (-1, -1), 0.3, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ])
    t = Table(data, hAlign="LEFT")
    t.setStyle(sty)
    return t

def _src(styles, extra=""):
    msg = "Source: Example source."
    if extra:
        msg += " " + extra
    return Paragraph(msg, styles["small"])

def _paint(logo):
    def paint(c, doc):
        w, h = letter
        c.saveState()
        c.setFillColor(Color(0.055, 0.455, 0.565, alpha=0.13))
        c.saveState()
        c.translate(w / 2, h / 2 - 10)
        c.rotate(34)
        c.setFont("Times-Bold", 16)
        c.drawCentredString(0, 12, BANNER)
        c.drawCentredString(0, -12, BANNER)
        c.restoreState()
        c.setFillColor(NAVY)
        c.rect(0, h - 22, w, 22, fill=1, stroke=0)
        c.setFillColor(CYAN)
        c.setFont("Times-Bold", 8)
        c.drawCentredString(w / 2, h - 15, BANNER)
        if logo and os.path.exists(logo):
            c.drawImage(logo, 40, h - 52, width=78, height=24, mask="auto", preserveAspectRatio=True, anchor="sw")
        c.setFillColor(MUTED)
        c.setFont("Times-Italic", 8)
        c.drawRightString(w - 40, h - 44, "Sample Edition")
        c.setFillColor(NAVY)
        c.rect(0, 0, w, 28, fill=1, stroke=0)
        c.setFillColor(CYAN)
        c.setFont("Times-Roman", 7.5)
        c.drawString(40, 11, BANNER)
        c.drawRightString(w - 40, 11, f"Sample page {doc.page}")
        c.restoreState()
    return paint

def build_sample_pdf(path, logo):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    styles = _styles()
    doc = BaseDocTemplate(
        path, pagesize=letter, title="State Government Trends Insights Report — Sample Edition",
        author="StateWatchPro",
    )
    frame = Frame(40, 40, letter[0] - 80, letter[1] - 108, id="body", showBoundary=0)
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=_paint(logo))])
    S = styles
    story = []
    story.append(Spacer(1, 18))
    story.append(Paragraph("STATEWATCHPRO", S["cover_kicker"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("State Government Trends Insights Report", S["h1"]))
    story.append(Paragraph("Sample Edition", ParagraphStyle("sub", parent=S["h1"], fontSize=16, textColor=TEAL, spaceAfter=10)))
    story.append(Paragraph(
        "A mock of the quarterly report for vendors and state government teams. "
        "It shows the sections a real issue would contain. Every figure is an example index.",
        S["body"]))
    disc = [[Paragraph(
        "<b>Disclaimer.</b> This Sample Edition is not a published report. "
        "The marks in it are illustrative data, not actual figures. "
        "They are not spend, awards, prices, market share, or legislation from any state. "
        "Do not cite them. A later edition would link each figure to its public source. "
        "In this file every source line reads “Example source.”",
        S["body"])]]
    box = Table(disc, colWidths=[500])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), AMBER),
        ("BOX", (0, 0), (-1, -1), 1, AMBER_LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(box)
    story.append(Spacer(1, 8))
    story.append(Paragraph("What this sample walks through", S["h2"]))
    items = [
        "Spend and award volume by category, agency type, and state, with a quarter-over-quarter and a year-over-year comparison.",
        "Categories that are growing or declining in the example.",
        "Emerging initiatives: AI, cybersecurity, broadband, and modernization of large program systems.",
        "Shifts in the example vendor index for Vendor A, Vendor B, and Vendor C.",
        "Price and unit-cost benchmarks, as an example index.",
        "Legislation trends and example model bills.",
        "A short insights summary of the example, not of any real state.",
    ]
    story.append(ListFlowable(
        [ListItem(Paragraph(t, S["li"]), leftIndent=12) for t in items],
        bulletType="bullet", start="•", bulletFontName="Times-Roman", bulletFontSize=10, leftIndent=16,
    ))
    story.append(Paragraph("Labels used throughout: Category A–D, Agency type 1–3, State 1–3, and Vendor A–C. None of these is a real state, agency, or vendor.", S["small"]))
    story.append(PageBreak())

    def section(title, paragraphs, drawing, headers, rows, note):
        block = [Paragraph(title, S["h2"])]
        for p in paragraphs:
            block.append(Paragraph(p, S["body"]))
        block.append(Spacer(1, 4))
        block.append(drawing)
        block.append(Spacer(1, 6))
        block.append(_table(headers, rows))
        block.append(_src(S, note))
        return block

    story.append(Paragraph("Spend and award volume by category", S["h1"]))
    story.append(Paragraph(
        "A quarterly issue compares award volume and spend for each category. "
        "This sample uses an example index so the shape of the chart is visible without standing in for real money or real counts. "
        "Teal is the example index for the sample quarter. Cyan is the example index for the prior quarter.",
        S["body"]))
    story.append(_bar(
        ["Category A", "Category B", "Category C", "Category D"],
        [(48, 62, 30, 55), (44, 51, 41, 46)],
        ["Teal: this quarter in the example", "Cyan: prior quarter in the example"],
    ))
    story.append(Spacer(1, 6))
    story.append(_table(
        ["Example label", "This quarter", "Prior quarter", "Prior year"],
        [
            ["Category A", "48", "44", "40"],
            ["Category B", "62", "51", "45"],
            ["Category C", "30", "41", "44"],
            ["Category D", "55", "46", "50"],
        ],
    ))
    story.append(_src(S, "Example index only. Not dollars and not a count of awards."))
    story.append(PageBreak())

    story.append(Paragraph("By agency type and by state", S["h1"]))
    story.append(Paragraph(
        "The same example index is split by agency type and by state. "
        "Agency type 1, Agency type 2, and Agency type 3 are placeholders. "
        "State 1, State 2, and State 3 are placeholders. "
        "Quarter-over-quarter is this sample quarter against the prior sample quarter. "
        "Year-over-year is this sample quarter against the sample quarter a year earlier.",
        S["body"]))
    story.append(_bar(
        ["Agency type 1", "Agency type 2", "Agency type 3"],
        [(52, 40, 36), (47, 44, 33)],
        ["Teal: this quarter", "Cyan: prior quarter"],
        width=500, height=180,
    ))
    story.append(Spacer(1, 6))
    story.append(_table(
        ["Example label", "State 1", "State 2", "State 3"],
        [
            ["Agency type 1", "52", "40", "33"],
            ["Agency type 2", "40", "48", "29"],
            ["Agency type 3", "36", "31", "44"],
        ],
    ))
    story.append(_src(S, "Example index by placeholder state and agency type."))
    story.append(PageBreak())

    story.append(Paragraph("Growing and declining categories", S["h1"]))
    story.append(Paragraph(
        "A real issue would say which categories are growing and which are declining, and would link the comparison to the source documents. "
        "In this sample the direction is assigned so the layout can be reviewed. It is not a finding.",
        S["body"]))
    story.append(_bar(
        ["Category A", "Category B", "Category C", "Category D"],
        [(8, 14, 6, 5)],
        ["Example magnitude of change in the sample (direction is in the table)"],
        ymax=20, height=180,
    ))
    story.append(Spacer(1, 6))
    story.append(_table(
        ["Example label", "Direction in this sample", "Compared with"],
        [
            ["Category A", "Growing", "Prior quarter and prior year"],
            ["Category B", "Growing", "Prior quarter and prior year"],
            ["Category C", "Declining", "Prior quarter and prior year"],
            ["Category D", "Growing", "Prior quarter only"],
        ],
    ))
    story.append(_src(S, "Direction words describe the example index, not a real market."))
    story.append(PageBreak())

    story.append(Paragraph("Emerging initiatives", S["h1"]))
    story.append(Paragraph(
        "The report has a place for initiatives that are showing up in solicitations and legislation. "
        "The topics below are the kinds of initiatives the section is built to hold: AI, cybersecurity, broadband, and modernization of large program systems. "
        "The example index beside each topic is not a measure of how common that work is.",
        S["body"]))
    story.append(_bar(
        ["AI", "Cybersecurity", "Broadband", "Modernization"],
        [(35, 42, 28, 38)],
        ["Example index for the topic in this sample"],
        ymax=60, height=180,
    ))
    story.append(Spacer(1, 6))
    story.append(_table(
        ["Initiative the section can cover", "Example index", "Where it appears in this sample"],
        [
            ["AI", "35", "State 1 and State 2"],
            ["Cybersecurity", "42", "State 1, State 2, and State 3"],
            ["Broadband", "28", "State 3"],
            ["Modernization of large program systems", "38", "State 2"],
        ],
    ))
    story.append(_src(S, "Topics are illustrative. The index is not a count of solicitations."))
    story.append(PageBreak())

    story.append(Paragraph("Vendor market share shifts", S["h1"]))
    story.append(Paragraph(
        "Vendor names in this sample are Vendor A, Vendor B, and Vendor C. "
        "The chart is an example share index, not a percentage of any real market and not a ranking of real firms.",
        S["body"]))
    story.append(_bar(
        ["Vendor A", "Vendor B", "Vendor C"],
        [(30, 45, 25), (36, 40, 24)],
        ["Teal: State 1 in the example", "Cyan: State 2 in the example"],
        ymax=60, height=180,
    ))
    story.append(Spacer(1, 6))
    story.append(_table(
        ["Example vendor", "State 1", "State 2", "Shift in this sample"],
        [
            ["Vendor A", "30", "36", "Higher in State 2"],
            ["Vendor B", "45", "40", "Lower in State 2"],
            ["Vendor C", "25", "24", "Nearly flat"],
        ],
    ))
    story.append(_src(S, "Example share index. Not a real market share."))
    story.append(PageBreak())

    story.append(Paragraph("Price and unit-cost benchmarks", S["h1"]))
    story.append(Paragraph(
        "Benchmarks in a real issue would trace to the documents states publish. "
        "Here the unit-cost view is an example index per unit, so the table can be laid out without quoting a real price.",
        S["body"]))
    story.append(_bar(
        ["State 1", "State 2", "State 3"],
        [(40, 55, 33), (42, 49, 37)],
        ["Teal: Category A example index per unit", "Cyan: Category B example index per unit"],
        ymax=80, height=180,
    ))
    story.append(Spacer(1, 6))
    story.append(_table(
        ["Example label", "State 1", "State 2", "State 3"],
        [
            ["Category A, example index per unit", "40", "55", "33"],
            ["Category B, example index per unit", "42", "49", "37"],
            ["Category D, example index per unit", "28", "31", "36"],
        ],
    ))
    story.append(_src(S, "Example index per unit. Not a price from a contract."))
    story.append(PageBreak())

    story.append(Paragraph("Legislation trends and model bills", S["h1"]))
    story.append(Paragraph(
        "This section is where a real issue would follow bills and model language moving from state to state. "
        "The rows below are example model bills, not enacted legislation and not bills from any legislature.",
        S["body"]))
    story.append(_table(
        ["Example model bill", "Seen in this sample", "Example pattern"],
        [
            ["Example model bill 1", "State 1, then State 2", "Similar language in the example set"],
            ["Example model bill 2", "State 2 and State 3", "Introduced in the example, not enacted"],
            ["Example model bill 3", "State 1 only", "No spread in the example"],
        ],
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "A published issue would name the bill, the chamber, and the source register, and would link each row. "
        "This sample stops at the layout and marks the source as an example.",
        S["body"]))
    story.append(_src(S, "Example model bills only."))
    story.append(PageBreak())

    story.append(Paragraph("Insights summary", S["h1"]))
    story.append(Paragraph(
        "The last page of an issue is a short reading of the quarter for vendors and for state government teams. "
        "The sentences below only restate the example. They are not findings about any state.",
        S["body"]))
    for text in [
        "In the example, Category B carries the highest example index and Category C is the one marked declining.",
        "The example gives Vendor B the higher example share index in State 1, and Vendor A the higher one in State 2.",
        "AI, cybersecurity, broadband, and modernization of large program systems are present as topics the section can hold. The example index does not say how widespread they are.",
        "Example model bill 1 is the only one in the sample that moves from State 1 to State 2.",
        "Vendors can use a real issue to see where similar work is being bought. State government teams can use it to benchmark against other states. Both would still open the source behind each figure.",
    ]:
        story.append(Paragraph(text, S["body"]))
    story.append(Spacer(1, 6))
    story.append(box)
    story.append(_src(S, "Summary of the example index on the previous pages."))
    doc.build(story)
    return path
