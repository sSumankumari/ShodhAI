from flask import Blueprint, request, jsonify, render_template, send_file, current_app
import os
from python_scripts.ocr import extract_text_from_file
from python_scripts.spelling_corrections import correct_spelling
from python_scripts.spacings import add_space_after_punctuation
from python_scripts.groqllm import clean_text
from werkzeug.utils import secure_filename
from fpdf import FPDF
from docx import Document

ocr_bp = Blueprint('ocr', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
UPLOAD_FOLDER = 'uploads'
TEMP_FOLDER = 'temp_files'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_image_pipeline(file_obj):
    text = extract_text_from_file(file_obj)
    text = correct_spelling(text)
    text = add_space_after_punctuation(text)
    text = clean_text(text)
    return text

@ocr_bp.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        if 'image' not in request.files:
            return 'No file part', 400
        file = request.files['image']
        if file.filename == '':
            return 'No selected file', 400
        if not allowed_file(file.filename):
            return 'Invalid file type', 400
        try:
            file.stream.seek(0)  # Reset file pointer (important for re-reading)
            extracted_text = process_image_pipeline(file.stream)
            return render_template('ocr_result.html', extracted_text=extracted_text)
        except Exception as e:
            return f'Error processing image: {str(e)}', 500
    return render_template('ocr_form.html')

@ocr_bp.route('/download', methods=['POST'])
def download():
    text = request.form.get('text')
    format_type = request.form.get('format')
    if not text:
        return 'No text provided', 400
    if not format_type:
        return 'No format specified', 400
    filename = f'extracted_text.{format_type}'
    output_path = os.path.join(TEMP_FOLDER, filename)
    try:
        if format_type == 'txt':
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(text)
        elif format_type == 'pdf':
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", size=12)
            pdf.multi_cell(0, 10, txt=text)
            pdf.output(output_path)
        elif format_type == 'docx':
            doc = Document()
            doc.add_paragraph(text)
            doc.save(output_path)
        else:
            return 'Invalid format type', 400
        return_data = send_file(output_path, as_attachment=True, download_name=filename)
        os.remove(output_path)
        return return_data
    except Exception as e:
        if os.path.exists(output_path):
            os.remove(output_path)
        return f'Error creating file: {str(e)}', 500