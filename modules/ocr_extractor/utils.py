import os
from .python_scripts.ocr import extract_text
from .python_scripts.spelling_corrections import correct_spelling
from .python_scripts.spacings import add_space_after_punctuation
from .python_scripts.groqllm import clean_text
from fpdf import FPDF
from docx import Document

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def process_image(image_path):
    try:
        text = extract_text(image_path)
        corrected_text = correct_spelling(text)
        spaced_text = add_space_after_punctuation(corrected_text)
        final_text = clean_text(spaced_text)
        return final_text
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return None

def create_text_file(text, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(text)

def create_pdf_file(text, output_path):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, txt=text)
    pdf.output(output_path)

def create_docx_file(text, output_path):
    doc = Document()
    doc.add_paragraph(text)
    doc.save(output_path)
