"""Render the editable handover guide to a shareable PDF using ReportLab."""
from pathlib import Path
import re
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Preformatted, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4

ROOT = Path(__file__).resolve().parents[2]
source = ROOT / "docs/handover/README.md"
output = ROOT / "output/pdf/Team17-Team12-API-Handover.pdf"
output.parent.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="GuideTitle", fontName="Helvetica-Bold", fontSize=26, leading=32, spaceAfter=21, textColor=colors.HexColor("#24352b")))
styles.add(ParagraphStyle(name="GuideHeading", fontName="Helvetica-Bold", fontSize=16, leading=21, spaceBefore=18, spaceAfter=11, keepWithNext=True, textColor=colors.HexColor("#24352b")))
styles.add(ParagraphStyle(name="GuideBody", fontName="Helvetica", fontSize=9.5, leading=14.5, spaceAfter=9, textColor=colors.HexColor("#3c4e40")))
styles.add(ParagraphStyle(name="GuideCell", parent=styles["GuideBody"], fontSize=8, leading=11, spaceAfter=0))
styles.add(ParagraphStyle(name="GuideCode", fontName="Courier", fontSize=7, leading=9.3, spaceBefore=8, spaceAfter=13, backColor=colors.HexColor("#f2f5ed"), borderPadding=9, splitLongWords=False))
flow = []
width = A4[0] - 96
lines = source.read_text(encoding="utf-8").splitlines()

def inline(text):
    return re.sub(r"`([^`]+)`", r'<font name="Courier">\1</font>', escape(text))

def paragraph(text):
    # ASCII checkbox marks remain portable in the standard PDF fonts.
    text = text.replace("- [x]", "[done]").replace("- [ ]", "[pending]")
    flow.append(Paragraph(inline(text), styles["GuideBody"]))

i = 0
while i < len(lines):
    line = lines[i]
    if not line.strip():
        i += 1
        continue
    if line.startswith("~~~"):
        code = []
        i += 1
        while i < len(lines) and not lines[i].startswith("~~~"):
            code.append(lines[i])
            i += 1
        flow.append(Preformatted("\n".join(code), styles["GuideCode"], maxLineLength=94, splitChars=" /,", newLineChars="  "))
    elif line.startswith("| "):
        rows = []
        while i < len(lines) and lines[i].startswith("|"):
            values = [x.strip() for x in lines[i].strip().strip("|").split("|")]
            if not all(re.fullmatch(r"[- :]+", x or " ") for x in values):
                rows.append([Paragraph(inline(x), styles["GuideCell"]) for x in values])
            i += 1
        count = len(rows[0])
        widths = [145, width - 145] if count == 2 else [75, 105, width - 180]
        table = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#eaf0e3")),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f7f9f3")]),
            ("LEFTPADDING", (0,0), (-1,-1), 8), ("RIGHTPADDING", (0,0), (-1,-1), 8),
            ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ]))
        flow.extend([table, Spacer(1, 12)])
        continue
    elif line.startswith("# "):
        flow.append(Paragraph(inline(line[2:]), styles["GuideTitle"]))
    elif line.startswith("## "):
        if line[3:] in ("Example list response", "Field dictionary", "Handover acceptance checklist"):
            flow.append(PageBreak())
        flow.append(Paragraph(inline(line[3:]), styles["GuideHeading"]))
    elif line.startswith(("Provider:", "Consumer:", "Contract version:", "Prepared:")):
        flow.append(Paragraph(inline(line.strip()), styles["GuideCell"]))
        flow.append(Spacer(1, 4))
    else:
        block = [line]
        while i+1 < len(lines) and lines[i+1].strip() and not lines[i+1].startswith(("#", "~~~", "|", "- ")) and not re.match(r"\d+\. ", lines[i+1]):
            i += 1
            block.append(lines[i])
        paragraph(" ".join(block))
    i += 1

def footer(canvas, doc):
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#819074"))
    canvas.drawString(48, 27, "Team 17 to Team 12  |  Contract 1.0  |  Local verification")
    canvas.drawRightString(A4[0]-48, 27, str(doc.page))

SimpleDocTemplate(str(output), pagesize=A4, leftMargin=48, rightMargin=48, topMargin=44, bottomMargin=48,
    title="Internship Opportunities API Handover", author="Team 17 Internship Management").build(flow, onFirstPage=footer, onLaterPages=footer)
print(output)
