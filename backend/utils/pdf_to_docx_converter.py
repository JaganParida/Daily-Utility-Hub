"""
PDF to DOCX Converter - Fully Editable Output
Primary: Custom PyMuPDF extractor (guarantees editable text)
Fallback: pdf2docx (may render some pages as images)
"""
import sys, os, io, traceback


def custom_convert(pdf_path, docx_path):
    """
    Extract text blocks + tables + images individually from PDF.
    Produces FULLY EDITABLE Word output — never renders pages as images.
    """
    import fitz
    from docx import Document
    from docx.shared import Pt, Inches, Cm, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    pdf = fitz.open(pdf_path)
    doc = Document()

    for s in doc.sections:
        s.top_margin = Cm(1.27)
        s.bottom_margin = Cm(1.27)
        s.left_margin = Cm(1.9)
        s.right_margin = Cm(1.27)

    for pi in range(len(pdf)):
        page = pdf[pi]
        pw = page.rect.width

        blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
        blocks.sort(key=lambda b: (round(b["bbox"][1] / 3) * 3, b["bbox"][0]))

        # ── Detect tables ──
        table_bi = set()
        tables_data = []
        try:
            found = page.find_tables()
            if found and found.tables:
                for t in found.tables:
                    tb = t.bbox
                    rows = t.extract()
                    if rows and len(rows) > 0:
                        tables_data.append({"bbox": tb, "rows": rows, "used": False})
                        for bi, b in enumerate(blocks):
                            if b["type"] == 0:
                                bb = b["bbox"]
                                if bb[0] >= tb[0]-5 and bb[1] >= tb[1]-5 and bb[2] <= tb[2]+5 and bb[3] <= tb[3]+5:
                                    table_bi.add(bi)
        except:
            pass

        # ── Track which images we've embedded (by xref) ──
        embedded_xrefs = set()

        # ── Process all blocks in Y-order ──
        for bi, block in enumerate(blocks):
            # Skip blocks that are inside a detected table
            if bi in table_bi:
                # Insert the table ONCE when we hit its first block
                for td in tables_data:
                    if td["used"]:
                        continue
                    tb = td["bbox"]
                    if block["bbox"][1] >= tb[1]-5 and block["bbox"][1] <= tb[3]+5:
                        _add_table(doc, td["rows"])
                        td["used"] = True
                        break
                continue

            if block["type"] == 0:
                # ── TEXT BLOCK → editable paragraphs ──
                _add_text(doc, block, pw)

            elif block["type"] == 1:
                # ── IMAGE BLOCK → embedded picture ──
                bbox = block["bbox"]
                w_pt = bbox[2] - bbox[0]
                h_pt = bbox[3] - bbox[1]

                # Skip tiny decorative images (borders, lines, dots)
                if w_pt < 15 or h_pt < 15:
                    continue

                img_data = block.get("image")

                # Try matching to an extracted xref image for better quality
                if not img_data:
                    for ii in page.get_images(full=True):
                        xref = ii[0]
                        if xref in embedded_xrefs:
                            continue
                        try:
                            rects = page.get_image_rects(xref)
                            for r in rects:
                                if abs(r.x0 - bbox[0]) < 20 and abs(r.y0 - bbox[1]) < 20:
                                    base = pdf.extract_image(xref)
                                    if base and base.get("image") and len(base["image"]) > 200:
                                        img_data = base["image"]
                                        embedded_xrefs.add(xref)
                                        break
                        except:
                            continue
                        if img_data:
                            break

                # Clip-render fallback
                if not img_data:
                    try:
                        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=fitz.Rect(bbox))
                        img_data = pix.tobytes("png")
                    except:
                        continue

                if not img_data or len(img_data) < 200:
                    continue

                # Only embed significant images (logos, photos, diagrams)
                # Skip tiny decorative pieces
                if len(img_data) < 500 and w_pt < 50 and h_pt < 50:
                    continue

                try:
                    w_in = min(w_pt / 72.0, 6.0)
                    para = doc.add_paragraph()
                    # Center large images, left-align small ones (like logos)
                    if w_pt > pw * 0.4:
                        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    para.paragraph_format.space_before = Pt(3)
                    para.paragraph_format.space_after = Pt(3)
                    run = para.add_run()
                    run.add_picture(io.BytesIO(img_data), width=Inches(max(w_in, 0.3)))
                except:
                    pass

        # ── Page break ──
        if pi < len(pdf) - 1:
            doc.add_page_break()

    pdf.close()
    doc.save(docx_path)


def _add_text(doc, block, pw):
    """Add a text block as editable paragraphs with formatting."""
    from docx.shared import Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    for line in block.get("lines", []):
        spans = line.get("spans", [])
        if not spans:
            continue
        full = "".join(s.get("text", "") for s in spans).strip()
        if not full:
            continue

        para = doc.add_paragraph()

        # Alignment detection
        lx0, lx1 = line["bbox"][0], line["bbox"][2]
        lw = lx1 - lx0
        lcenter = (lx0 + lx1) / 2
        pcenter = pw / 2

        if abs(lcenter - pcenter) < 30 and lw < pw * 0.7:
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif lx0 > pw * 0.55:
            para.alignment = WD_ALIGN_PARAGRAPH.RIGHT

        para.paragraph_format.space_before = Pt(0.5)
        para.paragraph_format.space_after = Pt(0.5)

        for span in spans:
            text = span.get("text", "")
            if not text:
                continue

            run = para.add_run(text)

            # Font size
            size = span.get("size", 11)
            run.font.size = Pt(max(6, min(48, size)))

            # Font name (clean subset prefix like ABCDEF+FontName)
            fn = span.get("font", "")
            if fn:
                clean = fn.split("+")[-1] if "+" in fn else fn
                # Map common PDF fonts
                font_map = {
                    "TimesNewRomanPSMT": "Times New Roman",
                    "TimesNewRomanPS-BoldMT": "Times New Roman",
                    "TimesNewRomanPS-ItalicMT": "Times New Roman",
                    "Times-Roman": "Times New Roman",
                    "Times-Bold": "Times New Roman",
                    "ArialMT": "Arial",
                    "Arial-BoldMT": "Arial",
                    "Helvetica": "Arial",
                    "Helvetica-Bold": "Arial",
                    "CourierNewPSMT": "Courier New",
                }
                mapped = font_map.get(clean, clean)
                run.font.name = mapped

            # Bold
            flags = span.get("flags", 0)
            if (flags & 16) or any(k in fn.lower() for k in ["bold", "black", "heavy"]):
                run.bold = True

            # Italic
            if (flags & 2) or any(k in fn.lower() for k in ["italic", "oblique"]):
                run.italic = True

            # Underline (rare in PDFs, flag bit 2^2)
            if flags & 4:
                run.underline = True

            # Color
            color = span.get("color", 0)
            if color and color != 0:
                try:
                    r = (color >> 16) & 0xFF
                    g = (color >> 8) & 0xFF
                    b = color & 0xFF
                    if not (r == 0 and g == 0 and b == 0):
                        run.font.color.rgb = RGBColor(r, g, b)
                except:
                    pass


def _add_table(doc, rows):
    """Add a table with borders."""
    from docx.shared import Pt
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    mc = max(len(r) for r in rows)
    if mc == 0:
        return

    t = doc.add_table(rows=len(rows), cols=mc)

    # Set borders
    tblPr = t._tbl.tblPr
    if tblPr is None:
        tblPr = OxmlElement('w:tblPr')
        t._tbl.insert(0, tblPr)

    borders = OxmlElement('w:tblBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        el = OxmlElement(f'w:{edge}')
        el.set(qn('w:val'), 'single')
        el.set(qn('w:sz'), '4')
        el.set(qn('w:space'), '0')
        el.set(qn('w:color'), '000000')
        borders.append(el)
    tblPr.append(borders)

    # Auto width
    tw = OxmlElement('w:tblW')
    tw.set(qn('w:w'), '5000')
    tw.set(qn('w:type'), 'pct')
    tblPr.append(tw)

    for ri, row in enumerate(rows):
        for ci in range(mc):
            cell = t.cell(ri, ci)
            txt = str(row[ci]).strip() if ci < len(row) and row[ci] else ""
            cell.text = txt
            for p in cell.paragraphs:
                p.paragraph_format.space_before = Pt(1)
                p.paragraph_format.space_after = Pt(1)
                for run in p.runs:
                    run.font.size = Pt(10)
                    if ri == 0:
                        run.bold = True

    # Space after table
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: pdf_to_docx_converter.py <pdf> <docx>", file=sys.stderr)
        sys.exit(1)

    pdf_in, docx_out = sys.argv[1], sys.argv[2]
    if not os.path.exists(pdf_in):
        print(f"ERROR: Not found: {pdf_in}", file=sys.stderr)
        sys.exit(1)

    ok = False

    # Primary: Custom PyMuPDF (always produces editable text)
    try:
        print("Converting with PyMuPDF (editable text mode)...", file=sys.stderr)
        custom_convert(pdf_in, docx_out)
        if os.path.exists(docx_out) and os.path.getsize(docx_out) > 100:
            ok = True
            print("Done.", file=sys.stderr)
    except Exception as e:
        print(f"Custom converter failed: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)

    # Fallback: pdf2docx
    if not ok:
        try:
            print("Fallback: pdf2docx...", file=sys.stderr)
            from pdf2docx import Converter
            cv = Converter(pdf_in)
            cv.convert(docx_out, start=0, end=None, multi_processing=False)
            cv.close()
            if os.path.exists(docx_out) and os.path.getsize(docx_out) > 100:
                ok = True
        except Exception as e:
            print(f"pdf2docx failed: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)

    if ok:
        print("SUCCESS")
    else:
        print("ERROR", file=sys.stderr)
        sys.exit(1)
