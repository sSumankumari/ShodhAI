import re
from PyPDF2 import PdfReader

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    return text

def read_pdf_text(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        text = ''.join([page.extract_text() or '' for page in reader.pages])
        return preprocess_text(text)
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
        return ""
