import sys
import os
import traceback

def convert_pdf_to_docx(pdf_path, docx_path):
    """Convert PDF to DOCX using pdf2docx with optimal settings."""
    from pdf2docx import Converter
    
    cv = Converter(pdf_path)
    cv.convert(
        docx_path,
        start=0,
        end=None,
        multi_processing=False,  # Safer for server environments
    )
    cv.close()

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python pdf_to_docx_converter.py <pdf_path> <docx_path>", file=sys.stderr)
        sys.exit(1)
    
    pdf_input = sys.argv[1]
    docx_output = sys.argv[2]
    
    if not os.path.exists(pdf_input):
        print(f"ERROR: Input file not found: {pdf_input}", file=sys.stderr)
        sys.exit(1)
    
    try:
        convert_pdf_to_docx(pdf_input, docx_output)
        
        if os.path.exists(docx_output) and os.path.getsize(docx_output) > 0:
            print("SUCCESS")
        else:
            print("ERROR: Output file was not created or is empty", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
