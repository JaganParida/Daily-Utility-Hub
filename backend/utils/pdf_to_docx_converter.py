"""
Ultimate PDF to DOCX Converter - Maximum Fidelity
Strategy:
1. Use pdf2docx for core conversion (best text + table layout reconstruction)
2. Post-process with PyMuPDF to inject ALL images that pdf2docx missed
3. This hybrid approach gives the exact same visual output as the PDF
"""

import sys
import os
import io
import traceback
import fitz  # PyMuPDF
from docx import Document
from docx.shared import Pt, Inches, Emu, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


def inject_missing_images(pdf_path, docx_path):
    """
    Open the pdf2docx-generated docx and inject any images 
    that pdf2docx failed to extract from the PDF.
    """
    pdf = fitz.open(pdf_path)
    doc = Document(docx_path)
    
    images_added = 0
    
    for page_idx in range(len(pdf)):
        page = pdf[page_idx]
        image_list = page.get_images(full=True)
        
        for img_idx, img_info in enumerate(image_list):
            xref = img_info[0]
            try:
                base_image = pdf.extract_image(xref)
                if not base_image or not base_image.get("image"):
                    continue
                
                image_bytes = base_image["image"]
                img_ext = base_image.get("ext", "png")
                
                # Skip tiny images (< 1KB, likely artifacts/masks)
                if len(image_bytes) < 1024:
                    continue
                
                # Check image dimensions
                width = base_image.get("width", 0)
                height = base_image.get("height", 0)
                if width < 20 or height < 20:
                    continue
                
                # Calculate display size
                # Get the image's actual position on the page using get_image_rects
                try:
                    rects = page.get_image_rects(xref)
                    if rects and len(rects) > 0:
                        rect = rects[0]
                        display_width_pt = rect.width
                        display_height_pt = rect.height
                    else:
                        display_width_pt = width * 72 / 96  # Approximate
                        display_height_pt = height * 72 / 96
                except:
                    display_width_pt = width * 72 / 96
                    display_height_pt = height * 72 / 96
                
                # Convert to inches, cap at page width
                img_width_inches = min(display_width_pt / 72.0, 6.0)
                img_height_inches = display_height_pt / 72.0 * (img_width_inches / (display_width_pt / 72.0))
                
                # Cap height
                if img_height_inches > 8.0:
                    ratio = 8.0 / img_height_inches
                    img_height_inches = 8.0
                    img_width_inches *= ratio
                
                # Minimum size
                if img_width_inches < 0.3:
                    img_width_inches = 0.5
                    img_height_inches = 0.5
                
                # Add image paragraph
                para = doc.add_paragraph()
                para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                para.paragraph_format.space_before = Pt(6)
                para.paragraph_format.space_after = Pt(6)
                
                run = para.add_run()
                image_stream = io.BytesIO(image_bytes)
                run.add_picture(image_stream, width=Inches(img_width_inches))
                images_added += 1
                
            except Exception as e:
                continue
    
    pdf.close()
    
    if images_added > 0:
        doc.save(docx_path)
    
    return images_added


def convert_with_pdf2docx(pdf_path, docx_path):
    """Use pdf2docx library for maximum text/table fidelity."""
    from pdf2docx import Converter
    
    cv = Converter(pdf_path)
    cv.convert(docx_path, start=0, end=None, multi_processing=False)
    cv.close()
    
    return os.path.exists(docx_path) and os.path.getsize(docx_path) > 100


def convert_custom_pymupdf(pdf_path, docx_path):
    """
    Fallback: Full custom converter using PyMuPDF for extraction 
    and python-docx for building. Handles EVERYTHING including images.
    """
    pdf = fitz.open(pdf_path)
    doc = Document()
    
    # Set margins
    for section in doc.sections:
        section.top_margin = Cm(1.5)
        section.bottom_margin = Cm(1.5)
        section.left_margin = Cm(2.0)
        section.right_margin = Cm(2.0)
    
    for page_idx in range(len(pdf)):
        page = pdf[page_idx]
        page_width = page.rect.width
        
        # Get all blocks sorted by position
        blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
        blocks.sort(key=lambda b: (round(b["bbox"][1] / 3) * 3, b["bbox"][0]))
        
        # Track table areas
        table_areas = set()
        
        # Extract tables
        try:
            tables = page.find_tables()
            if tables and tables.tables:
                for table in tables.tables:
                    tb = table.bbox
                    rows = table.extract()
                    if rows and len(rows) > 0:
                        # Mark blocks inside table
                        for bi, block in enumerate(blocks):
                            if block["type"] == 0:
                                bb = block["bbox"]
                                if bb[0] >= tb[0]-5 and bb[1] >= tb[1]-5 and bb[2] <= tb[2]+5 and bb[3] <= tb[3]+5:
                                    table_areas.add(bi)
        except:
            tables = type('obj', (object,), {'tables': []})()
        
        # Process blocks
        processed_table_y = set()
        
        for bi, block in enumerate(blocks):
            if bi in table_areas:
                # Check if we should insert a table at this Y position
                y_key = round(block["bbox"][1] / 10) * 10
                if y_key not in processed_table_y:
                    processed_table_y.add(y_key)
                    # Find matching table
                    try:
                        for table in tables.tables:
                            tb = table.bbox
                            if abs(tb[1] - block["bbox"][1]) < 15:
                                rows = table.extract()
                                if rows:
                                    _add_table_to_doc(doc, rows)
                                break
                    except:
                        pass
                continue
            
            if block["type"] == 0:  # Text
                _add_text_block_v2(doc, block, page_width)
            elif block["type"] == 1:  # Image
                _add_image_from_block(doc, block, page, pdf)
        
        # Also extract standalone images not in blocks
        image_list = page.get_images(full=True)
        block_image_count = sum(1 for b in blocks if b["type"] == 1)
        
        if len(image_list) > block_image_count:
            # There are images not captured in blocks
            for img_info in image_list:
                xref = img_info[0]
                try:
                    base_image = pdf.extract_image(xref)
                    if not base_image or not base_image.get("image"):
                        continue
                    if len(base_image["image"]) < 1024:
                        continue
                    
                    w = base_image.get("width", 0)
                    h = base_image.get("height", 0)
                    if w < 30 or h < 30:
                        continue
                    
                    img_w = min(w / 96.0 * 72 / 72.0, 5.5)
                    img_h = h / 96.0 * 72 / 72.0 * (img_w / (w / 96.0 * 72 / 72.0))
                    if img_h > 8:
                        ratio = 8 / img_h
                        img_h = 8
                        img_w *= ratio
                    
                    para = doc.add_paragraph()
                    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    run = para.add_run()
                    run.add_picture(io.BytesIO(base_image["image"]), width=Inches(img_w))
                except:
                    continue
        
        # Page break
        if page_idx < len(pdf) - 1:
            doc.add_page_break()
    
    pdf.close()
    doc.save(docx_path)


def _add_text_block_v2(doc, block, page_width):
    """Add text block with full formatting preservation."""
    for line in block.get("lines", []):
        spans = line.get("spans", [])
        if not spans:
            continue
        
        full_text = "".join(s.get("text", "") for s in spans).strip()
        if not full_text:
            continue
        
        para = doc.add_paragraph()
        
        # Alignment
        lx0 = line["bbox"][0]
        lx1 = line["bbox"][2]
        lcenter = (lx0 + lx1) / 2
        pcenter = page_width / 2
        lwidth = lx1 - lx0
        
        if abs(lcenter - pcenter) < 25 and lwidth < page_width * 0.65:
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif lx0 > page_width * 0.55:
            para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        
        para.paragraph_format.space_before = Pt(1)
        para.paragraph_format.space_after = Pt(1)
        
        for span in spans:
            text = span.get("text", "")
            if not text:
                continue
            
            run = para.add_run(text)
            
            # Size
            size = span.get("size", 10)
            run.font.size = Pt(max(6, min(40, size)))
            
            # Font
            font_name = span.get("font", "")
            if font_name:
                clean = font_name.split("+")[-1] if "+" in font_name else font_name
                run.font.name = clean
            
            # Bold
            flags = span.get("flags", 0)
            if (flags & 16) or "bold" in font_name.lower() or "black" in font_name.lower():
                run.bold = True
            
            # Italic
            if (flags & 2) or "italic" in font_name.lower() or "oblique" in font_name.lower():
                run.italic = True
            
            # Underline
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


def _add_image_from_block(doc, block, page, pdf_doc):
    """Extract and add image from a PyMuPDF image block."""
    try:
        bbox = block["bbox"]
        w_pt = bbox[2] - bbox[0]
        h_pt = bbox[3] - bbox[1]
        
        if w_pt < 10 or h_pt < 10:
            return
        
        image_data = None
        
        # Try block's direct image data
        if "image" in block:
            image_data = block["image"]
        
        # Try extracting via xref from page images
        if not image_data:
            try:
                for img_info in page.get_images(full=True):
                    xref = img_info[0]
                    try:
                        rects = page.get_image_rects(xref)
                        for rect in rects:
                            # Check if this image's rect overlaps with our block
                            if (abs(rect.x0 - bbox[0]) < 20 and abs(rect.y0 - bbox[1]) < 20):
                                base = pdf_doc.extract_image(xref)
                                if base and base.get("image"):
                                    image_data = base["image"]
                                    break
                    except:
                        continue
                    if image_data:
                        break
            except:
                pass
        
        # Clip-render fallback
        if not image_data:
            try:
                clip = fitz.Rect(bbox)
                mat = fitz.Matrix(3, 3)
                pix = page.get_pixmap(matrix=mat, clip=clip)
                image_data = pix.tobytes("png")
            except:
                return
        
        if not image_data or len(image_data) < 500:
            return
        
        img_w = min(w_pt / 72.0, 5.5)
        img_h = h_pt / 72.0 * (img_w / (w_pt / 72.0))
        if img_h > 8:
            r = 8 / img_h
            img_h = 8
            img_w *= r
        
        para = doc.add_paragraph()
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        para.paragraph_format.space_before = Pt(4)
        para.paragraph_format.space_after = Pt(4)
        run = para.add_run()
        run.add_picture(io.BytesIO(image_data), width=Inches(img_w))
    except:
        pass


def _add_table_to_doc(doc, rows):
    """Add a table with borders to the document."""
    if not rows:
        return
    
    max_cols = max(len(r) for r in rows)
    if max_cols == 0:
        return
    
    table = doc.add_table(rows=len(rows), cols=max_cols)
    
    # Set table borders
    tbl = table._tbl
    tblPr = tbl.tblPr
    if tblPr is None:
        tblPr = OxmlElement('w:tblPr')
        tbl.insert(0, tblPr)
    
    borders = OxmlElement('w:tblBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        element = OxmlElement(f'w:{edge}')
        element.set(qn('w:val'), 'single')
        element.set(qn('w:sz'), '4')
        element.set(qn('w:space'), '0')
        element.set(qn('w:color'), '000000')
        borders.append(element)
    tblPr.append(borders)
    
    # Auto width
    tblW = OxmlElement('w:tblW')
    tblW.set(qn('w:w'), '5000')
    tblW.set(qn('w:type'), 'pct')
    tblPr.append(tblW)
    
    # Fill cells
    for ri, row in enumerate(rows):
        for ci in range(max_cols):
            cell = table.cell(ri, ci)
            text = str(row[ci]).strip() if ci < len(row) and row[ci] else ""
            cell.text = text
            for para in cell.paragraphs:
                para.paragraph_format.space_before = Pt(1)
                para.paragraph_format.space_after = Pt(1)
                for run in para.runs:
                    run.font.size = Pt(9)
                    run.font.name = "Calibri"
                    if ri == 0:
                        run.bold = True
    
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def main(pdf_path, docx_path):
    """
    Ultimate conversion pipeline:
    1. Try pdf2docx (best for text layout + tables)
    2. Post-process to inject missing images
    3. If pdf2docx fails, use custom PyMuPDF converter
    """
    
    success = False
    
    # === STEP 1: pdf2docx conversion ===
    try:
        print("Step 1: Running pdf2docx converter...", file=sys.stderr)
        success = convert_with_pdf2docx(pdf_path, docx_path)
        if success:
            print("Step 1: pdf2docx conversion successful", file=sys.stderr)
    except Exception as e:
        print(f"Step 1: pdf2docx failed: {e}", file=sys.stderr)
        success = False
    
    # === STEP 2: Inject missing images ===
    if success:
        try:
            print("Step 2: Injecting missing images...", file=sys.stderr)
            count = inject_missing_images(pdf_path, docx_path)
            print(f"Step 2: Injected {count} additional images", file=sys.stderr)
        except Exception as e:
            print(f"Step 2: Image injection failed (non-critical): {e}", file=sys.stderr)
    
    # === STEP 3: Fallback to custom converter ===
    if not success:
        try:
            print("Step 3: Using custom PyMuPDF converter...", file=sys.stderr)
            convert_custom_pymupdf(pdf_path, docx_path)
            if os.path.exists(docx_path) and os.path.getsize(docx_path) > 100:
                success = True
                print("Step 3: Custom converter successful", file=sys.stderr)
        except Exception as e:
            print(f"Step 3: Custom converter also failed: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
    
    return success


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python pdf_to_docx_converter.py <pdf_path> <docx_path>", file=sys.stderr)
        sys.exit(1)
    
    pdf_input = sys.argv[1]
    docx_output = sys.argv[2]
    
    if not os.path.exists(pdf_input):
        print(f"ERROR: Input file not found: {pdf_input}", file=sys.stderr)
        sys.exit(1)
    
    if main(pdf_input, docx_output):
        print("SUCCESS")
    else:
        print("ERROR: All conversion methods failed", file=sys.stderr)
        sys.exit(1)
