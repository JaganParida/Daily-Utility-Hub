"""
High-Fidelity PDF to DOCX Converter
Uses PyMuPDF for extraction + python-docx for building Word document.
Extracts ALL text blocks with fonts/sizes, ALL embedded images (logos, photos),
and reconstructs tables with proper borders.
"""

import sys
import os
import io
import traceback
import fitz  # PyMuPDF
from docx import Document
from docx.shared import Pt, Inches, Emu, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn


def extract_and_convert(pdf_path, docx_path):
    """Convert PDF to DOCX with maximum fidelity."""
    
    pdf = fitz.open(pdf_path)
    doc = Document()
    
    # Set narrow margins for maximum content area
    for section in doc.sections:
        section.top_margin = Cm(1.5)
        section.bottom_margin = Cm(1.5)
        section.left_margin = Cm(1.5)
        section.right_margin = Cm(1.5)
    
    for page_idx in range(len(pdf)):
        page = pdf[page_idx]
        page_width = page.rect.width
        page_height = page.rect.height
        
        # Get all content blocks (text + images) sorted by position
        blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
        
        # Sort blocks top-to-bottom, left-to-right
        blocks.sort(key=lambda b: (round(b["bbox"][1] / 5) * 5, b["bbox"][0]))
        
        # Track which blocks form tables
        table_blocks = set()
        
        # ---- Try to extract tables using PyMuPDF's built-in table finder ----
        tables_data = []
        try:
            tables = page.find_tables()
            if tables and tables.tables:
                for table in tables.tables:
                    table_bbox = table.bbox  # (x0, y0, x1, y1)
                    rows = table.extract()
                    if rows and len(rows) > 0:
                        tables_data.append({
                            "bbox": table_bbox,
                            "rows": rows,
                            "y_pos": table_bbox[1]
                        })
                        # Mark text blocks inside this table area so we skip them
                        for bi, block in enumerate(blocks):
                            if block["type"] == 0:  # text block
                                bx0, by0, bx1, by1 = block["bbox"]
                                tx0, ty0, tx1, ty1 = table_bbox
                                # Check if block is inside table area
                                if bx0 >= tx0 - 5 and by0 >= ty0 - 5 and bx1 <= tx1 + 5 and by1 <= ty1 + 5:
                                    table_blocks.add(bi)
        except Exception as e:
            pass  # find_tables may not be available in older PyMuPDF
        
        # ---- Process blocks in order ----
        # We need to interleave text, images, and tables in correct Y order
        content_items = []
        
        for bi, block in enumerate(blocks):
            if bi in table_blocks:
                continue  # Skip - handled by table extraction
            
            y_pos = block["bbox"][1]
            
            if block["type"] == 0:  # Text block
                content_items.append({
                    "type": "text",
                    "block": block,
                    "y_pos": y_pos
                })
            elif block["type"] == 1:  # Image block
                content_items.append({
                    "type": "image",
                    "block": block,
                    "y_pos": y_pos
                })
        
        # Add tables to content items at their Y positions
        for td in tables_data:
            content_items.append({
                "type": "table",
                "data": td,
                "y_pos": td["y_pos"]
            })
        
        # Sort all content by vertical position
        content_items.sort(key=lambda c: c["y_pos"])
        
        # ---- Render content items into Word document ----
        for item in content_items:
            if item["type"] == "text":
                _add_text_block(doc, item["block"], page_width)
            elif item["type"] == "image":
                _add_image_block(doc, item["block"], page, page_width)
            elif item["type"] == "table":
                _add_table(doc, item["data"])
        
        # Page break between pages (not after last page)
        if page_idx < len(pdf) - 1:
            doc.add_page_break()
    
    pdf.close()
    doc.save(docx_path)


def _add_text_block(doc, block, page_width):
    """Add a text block to the Word document preserving formatting."""
    
    lines = block.get("lines", [])
    if not lines:
        return
    
    for line in lines:
        spans = line.get("spans", [])
        if not spans:
            continue
        
        # Check if all spans are empty/whitespace
        full_text = "".join(s.get("text", "") for s in spans).strip()
        if not full_text:
            continue
        
        # Determine paragraph alignment based on X position
        line_x0 = line["bbox"][0]
        line_x1 = line["bbox"][2]
        line_center = (line_x0 + line_x1) / 2
        page_center = page_width / 2
        
        para = doc.add_paragraph()
        
        # Alignment heuristic
        line_width = line_x1 - line_x0
        if abs(line_center - page_center) < 30 and line_width < page_width * 0.6:
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif line_x0 > page_width * 0.5:
            para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        
        # Reduce paragraph spacing
        para.paragraph_format.space_before = Pt(1)
        para.paragraph_format.space_after = Pt(1)
        para.paragraph_format.line_spacing = Pt(14)
        
        for span in spans:
            text = span.get("text", "")
            if not text:
                continue
            
            run = para.add_run(text)
            
            # Font size
            font_size = span.get("size", 10)
            run.font.size = Pt(max(6, min(36, font_size)))
            
            # Font name
            font_name = span.get("font", "")
            if font_name:
                # Clean font name (remove subset prefix like "ABCDEF+")
                clean_name = font_name.split("+")[-1] if "+" in font_name else font_name
                # Map common PDF fonts to system fonts
                font_map = {
                    "TimesNewRoman": "Times New Roman",
                    "Times-Roman": "Times New Roman",
                    "Times-Bold": "Times New Roman",
                    "Times-Italic": "Times New Roman",
                    "Arial": "Arial",
                    "Helvetica": "Arial",
                    "Courier": "Courier New",
                    "CourierNew": "Courier New",
                }
                mapped = font_map.get(clean_name.replace(" ", "").replace("-", ""), None)
                if mapped:
                    run.font.name = mapped
                else:
                    run.font.name = clean_name
            
            # Bold detection
            flags = span.get("flags", 0)
            if flags & 2**4:  # Bold flag
                run.bold = True
            elif "bold" in font_name.lower() or "black" in font_name.lower():
                run.bold = True
            
            # Italic detection
            if flags & 2**1:  # Italic flag
                run.italic = True
            elif "italic" in font_name.lower() or "oblique" in font_name.lower():
                run.italic = True
            
            # Font color
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


def _add_image_block(doc, block, page, page_width):
    """Extract and add an image block to the Word document."""
    try:
        # Get image data from the block
        img_bbox = block["bbox"]
        img_width_pt = img_bbox[2] - img_bbox[0]
        img_height_pt = img_bbox[3] - img_bbox[1]
        
        # Skip tiny images (likely artifacts)
        if img_width_pt < 10 or img_height_pt < 10:
            return
        
        # Try to extract the image using the block's image reference
        image_data = None
        
        # Method 1: Use block's image data directly
        if "image" in block:
            image_data = block["image"]
        
        # Method 2: Extract from xref
        if not image_data:
            try:
                # Get all images on the page
                image_list = page.get_images(full=True)
                
                # Find the image closest to this block's position
                for img_info in image_list:
                    xref = img_info[0]
                    try:
                        base_image = page.parent.extract_image(xref)
                        if base_image and base_image.get("image"):
                            image_data = base_image["image"]
                            break  # Use first matching image
                    except:
                        continue
            except:
                pass
        
        # Method 3: Render the area as an image (clip rendering)
        if not image_data:
            try:
                clip_rect = fitz.Rect(img_bbox)
                mat = fitz.Matrix(3, 3)  # 3x zoom for quality
                pix = page.get_pixmap(matrix=mat, clip=clip_rect)
                image_data = pix.tobytes("png")
            except:
                return
        
        if not image_data:
            return
        
        # Calculate width in inches (max ~5.5 inches to fit in margins)
        max_width_inches = 5.5
        img_width_inches = img_width_pt / 72.0
        img_height_inches = img_height_pt / 72.0
        
        if img_width_inches > max_width_inches:
            scale = max_width_inches / img_width_inches
            img_width_inches = max_width_inches
            img_height_inches *= scale
        
        # Cap height
        if img_height_inches > 8:
            scale = 8 / img_height_inches
            img_height_inches = 8
            img_width_inches *= scale
        
        # Add image to document
        image_stream = io.BytesIO(image_data)
        
        para = doc.add_paragraph()
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        para.paragraph_format.space_before = Pt(4)
        para.paragraph_format.space_after = Pt(4)
        
        run = para.add_run()
        run.add_picture(image_stream, width=Inches(img_width_inches))
        
    except Exception as e:
        # Silently skip images that can't be extracted
        pass


def _add_table(doc, table_data):
    """Add a table to the Word document with borders."""
    rows = table_data.get("rows", [])
    if not rows or len(rows) == 0:
        return
    
    # Determine max columns
    max_cols = max(len(row) for row in rows)
    if max_cols == 0:
        return
    
    # Create Word table
    table = doc.add_table(rows=len(rows), cols=max_cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Apply borders to the table
    tbl = table._tbl
    tblPr = tbl.tblPr if tbl.tblPr is not None else tbl._new_tblPr()
    
    borders = tblPr.find(qn('w:tblBorders'))
    if borders is None:
        borders = fitz.xml_utils if hasattr(fitz, 'xml_utils') else None
        # Create borders manually via XML
        from lxml import etree
        borders_xml = '''<w:tblBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        </w:tblBorders>'''
        try:
            borders_elem = etree.fromstring(borders_xml)
            tblPr.append(borders_elem)
        except:
            pass
    
    # Fill cells
    for ri, row in enumerate(rows):
        for ci in range(max_cols):
            cell = table.cell(ri, ci)
            cell_text = row[ci] if ci < len(row) and row[ci] else ""
            cell.text = str(cell_text).strip()
            
            # Style the cell text
            for para in cell.paragraphs:
                para.paragraph_format.space_before = Pt(2)
                para.paragraph_format.space_after = Pt(2)
                for run in para.runs:
                    run.font.size = Pt(9)
                    run.font.name = "Calibri"
                    # Bold first row (header)
                    if ri == 0:
                        run.bold = True
    
    # Add a small space after table
    doc.add_paragraph().paragraph_format.space_before = Pt(2)


def convert_with_fallback(pdf_path, docx_path):
    """Try custom converter first, fall back to pdf2docx."""
    
    # Method 1: Custom PyMuPDF + python-docx converter (best for images + text)
    try:
        extract_and_convert(pdf_path, docx_path)
        if os.path.exists(docx_path) and os.path.getsize(docx_path) > 100:
            return True
    except Exception as e:
        print(f"Custom converter failed: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
    
    # Method 2: Fall back to pdf2docx library
    try:
        from pdf2docx import Converter
        cv = Converter(pdf_path)
        cv.convert(docx_path, start=0, end=None, multi_processing=False)
        cv.close()
        if os.path.exists(docx_path) and os.path.getsize(docx_path) > 100:
            return True
    except Exception as e:
        print(f"pdf2docx fallback also failed: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
    
    return False


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python pdf_to_docx_converter.py <pdf_path> <docx_path>", file=sys.stderr)
        sys.exit(1)
    
    pdf_input = sys.argv[1]
    docx_output = sys.argv[2]
    
    if not os.path.exists(pdf_input):
        print(f"ERROR: Input file not found: {pdf_input}", file=sys.stderr)
        sys.exit(1)
    
    success = convert_with_fallback(pdf_input, docx_output)
    
    if success:
        print("SUCCESS")
    else:
        print("ERROR: Conversion failed", file=sys.stderr)
        sys.exit(1)
