"""
PDF to DOCX Converter - Production Grade
Uses pdf2docx for text/tables + PyMuPDF for missing image injection.
"""
import sys, os, io, traceback

def convert(pdf_path, docx_path):
    """Primary: pdf2docx + image injection post-processing."""
    import fitz
    from pdf2docx import Converter
    from docx import Document
    from docx.shared import Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    # Step 1: pdf2docx core conversion
    print("  [1/3] pdf2docx converting...", file=sys.stderr)
    cv = Converter(pdf_path)
    cv.convert(docx_path, start=0, end=None, multi_processing=False)
    cv.close()
    
    if not os.path.exists(docx_path) or os.path.getsize(docx_path) < 100:
        raise RuntimeError("pdf2docx produced empty output")
    
    # Step 2: Count images already in the docx
    from zipfile import ZipFile
    existing = 0
    try:
        with ZipFile(docx_path, 'r') as z:
            existing = len([f for f in z.namelist() if f.startswith('word/media/')])
    except:
        pass
    print(f"  [2/3] pdf2docx included {existing} images", file=sys.stderr)
    
    # Step 3: Extract ALL images from PDF and inject missing ones
    pdf = fitz.open(pdf_path)
    total_pdf_images = 0
    inject_images = []
    
    for page_idx in range(len(pdf)):
        page = pdf[page_idx]
        for img_info in page.get_images(full=True):
            xref = img_info[0]
            try:
                base = pdf.extract_image(xref)
                if not base or not base.get("image"):
                    continue
                img_bytes = base["image"]
                w, h = base.get("width", 0), base.get("height", 0)
                
                # Skip tiny images (artifacts, masks)
                if len(img_bytes) < 500 or w < 20 or h < 20:
                    continue
                
                total_pdf_images += 1
                
                # Get display size
                dw, dh = w * 72 / 96, h * 72 / 96
                try:
                    rects = page.get_image_rects(xref)
                    if rects and len(rects) > 0:
                        dw, dh = rects[0].width, rects[0].height
                except:
                    pass
                
                inject_images.append({
                    "data": img_bytes,
                    "w_inches": min(dw / 72.0, 6.0),
                    "h_inches": min(dh / 72.0, 8.0),
                    "page": page_idx
                })
            except:
                continue
    pdf.close()
    
    print(f"  [3/3] PDF has {total_pdf_images} images total", file=sys.stderr)
    
    # Only inject if pdf2docx missed images
    if total_pdf_images > existing and inject_images:
        doc = Document(docx_path)
        added = 0
        for img in inject_images:
            try:
                para = doc.add_paragraph()
                para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = para.add_run()
                run.add_picture(
                    io.BytesIO(img["data"]),
                    width=Inches(max(img["w_inches"], 0.5))
                )
                added += 1
            except:
                continue
        if added > 0:
            doc.save(docx_path)
        print(f"  Injected {added} missing images", file=sys.stderr)
    else:
        print("  All images present, no injection needed", file=sys.stderr)


def fallback_convert(pdf_path, docx_path):
    """Fallback: PyMuPDF text extraction + image extraction → python-docx."""
    import fitz
    from docx import Document
    from docx.shared import Pt, Inches, Cm, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    pdf = fitz.open(pdf_path)
    doc = Document()
    
    for section in doc.sections:
        section.top_margin = Cm(1.5)
        section.bottom_margin = Cm(1.5)
        section.left_margin = Cm(2.0)
        section.right_margin = Cm(2.0)
    
    for pi in range(len(pdf)):
        page = pdf[pi]
        pw = page.rect.width
        blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
        blocks.sort(key=lambda b: (round(b["bbox"][1] / 3) * 3, b["bbox"][0]))
        
        # Tables
        table_bi = set()
        tables_data = []
        try:
            tables = page.find_tables()
            if tables and tables.tables:
                for t in tables.tables:
                    tb = t.bbox
                    rows = t.extract()
                    if rows:
                        tables_data.append({"bbox": tb, "rows": rows})
                        for bi, b in enumerate(blocks):
                            if b["type"] == 0:
                                bb = b["bbox"]
                                if bb[0] >= tb[0]-5 and bb[1] >= tb[1]-5 and bb[2] <= tb[2]+5 and bb[3] <= tb[3]+5:
                                    table_bi.add(bi)
        except:
            pass
        
        done_tables = set()
        for bi, block in enumerate(blocks):
            if bi in table_bi:
                yk = round(block["bbox"][1] / 10) * 10
                if yk not in done_tables:
                    done_tables.add(yk)
                    for td in tables_data:
                        if abs(td["bbox"][1] - block["bbox"][1]) < 15:
                            _make_table(doc, td["rows"])
                            break
                continue
            
            if block["type"] == 0:
                for line in block.get("lines", []):
                    spans = line.get("spans", [])
                    text = "".join(s.get("text", "") for s in spans).strip()
                    if not text:
                        continue
                    para = doc.add_paragraph()
                    lx0, lx1 = line["bbox"][0], line["bbox"][2]
                    if abs((lx0+lx1)/2 - pw/2) < 25 and (lx1-lx0) < pw*0.65:
                        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    para.paragraph_format.space_before = Pt(1)
                    para.paragraph_format.space_after = Pt(1)
                    for s in spans:
                        t = s.get("text", "")
                        if not t: continue
                        run = para.add_run(t)
                        run.font.size = Pt(max(6, min(40, s.get("size", 10))))
                        fn = s.get("font", "")
                        if fn:
                            run.font.name = fn.split("+")[-1] if "+" in fn else fn
                        fl = s.get("flags", 0)
                        if (fl & 16) or "bold" in fn.lower(): run.bold = True
                        if (fl & 2) or "italic" in fn.lower(): run.italic = True
            
            elif block["type"] == 1:
                bbox = block["bbox"]
                wp, hp = bbox[2]-bbox[0], bbox[3]-bbox[1]
                if wp < 10 or hp < 10: continue
                img_data = block.get("image")
                if not img_data:
                    for ii in page.get_images(full=True):
                        try:
                            rects = page.get_image_rects(ii[0])
                            for r in rects:
                                if abs(r.x0-bbox[0]) < 20 and abs(r.y0-bbox[1]) < 20:
                                    base = pdf.extract_image(ii[0])
                                    if base and base.get("image"):
                                        img_data = base["image"]
                                        break
                        except: continue
                        if img_data: break
                if not img_data:
                    try:
                        pix = page.get_pixmap(matrix=fitz.Matrix(3,3), clip=fitz.Rect(bbox))
                        img_data = pix.tobytes("png")
                    except: continue
                if img_data and len(img_data) > 500:
                    try:
                        para = doc.add_paragraph()
                        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        run = para.add_run()
                        run.add_picture(io.BytesIO(img_data), width=Inches(min(wp/72, 5.5)))
                    except: pass
        
        # Extra images
        imgs = page.get_images(full=True)
        bimgs = sum(1 for b in blocks if b["type"] == 1)
        if len(imgs) > bimgs:
            for ii in imgs:
                try:
                    base = pdf.extract_image(ii[0])
                    if not base or not base.get("image") or len(base["image"]) < 500: continue
                    w, h = base.get("width", 0), base.get("height", 0)
                    if w < 30 or h < 30: continue
                    para = doc.add_paragraph()
                    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    run = para.add_run()
                    run.add_picture(io.BytesIO(base["image"]), width=Inches(min(w*72/96/72, 5.5)))
                except: continue
        
        if pi < len(pdf) - 1:
            doc.add_page_break()
    
    pdf.close()
    doc.save(docx_path)


def _make_table(doc, rows):
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    from docx.shared import Pt
    
    mc = max(len(r) for r in rows)
    if mc == 0: return
    t = doc.add_table(rows=len(rows), cols=mc)
    
    tbl = t._tbl
    tblPr = tbl.tblPr or OxmlElement('w:tblPr')
    borders = OxmlElement('w:tblBorders')
    for e in ('top','left','bottom','right','insideH','insideV'):
        el = OxmlElement(f'w:{e}')
        el.set(qn('w:val'), 'single')
        el.set(qn('w:sz'), '4')
        el.set(qn('w:space'), '0')
        el.set(qn('w:color'), '000000')
        borders.append(el)
    tblPr.append(borders)
    
    for ri, row in enumerate(rows):
        for ci in range(mc):
            cell = t.cell(ri, ci)
            cell.text = str(row[ci]).strip() if ci < len(row) and row[ci] else ""
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.size = Pt(9)
                    if ri == 0: run.bold = True


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: pdf_to_docx_converter.py <pdf> <docx>", file=sys.stderr)
        sys.exit(1)
    
    pdf_in, docx_out = sys.argv[1], sys.argv[2]
    
    if not os.path.exists(pdf_in):
        print(f"ERROR: Not found: {pdf_in}", file=sys.stderr)
        sys.exit(1)
    
    ok = False
    
    # Primary: pdf2docx + image injection
    try:
        print("Method 1: pdf2docx + image injection", file=sys.stderr)
        convert(pdf_in, docx_out)
        if os.path.exists(docx_out) and os.path.getsize(docx_out) > 100:
            ok = True
    except Exception as e:
        print(f"Method 1 failed: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
    
    # Fallback: custom PyMuPDF
    if not ok:
        try:
            print("Method 2: Custom PyMuPDF fallback", file=sys.stderr)
            fallback_convert(pdf_in, docx_out)
            if os.path.exists(docx_out) and os.path.getsize(docx_out) > 100:
                ok = True
        except Exception as e:
            print(f"Method 2 failed: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
    
    if ok:
        print("SUCCESS")
    else:
        print("ERROR: All methods failed", file=sys.stderr)
        sys.exit(1)
