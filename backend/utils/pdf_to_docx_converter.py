import sys
import os
from pdf2docx import Converter

def convert_pdf_to_docx(pdf_path, docx_path):
    cv = Converter(pdf_path)
    cv.convert(docx_path, start=0, end=None)
    cv.close()

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python pdf_to_docx_converter.py <pdf_path> <docx_path>")
        sys.exit(1)
    
    pdf_input = sys.argv[1]
    docx_output = sys.argv[2]
    
    try:
        convert_pdf_to_docx(pdf_input, docx_output)
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)
