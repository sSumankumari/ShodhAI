from flask import Blueprint, render_template, request, send_file, current_app
from werkzeug.utils import secure_filename
import os

from config import UPLOAD_FOLDER, TEMP_FOLDER, ALLOWED_EXTENSIONS
from utils import allowed_file, process_image, create_text_file, create_pdf_file, create_docx_file

ocr_bp = Blueprint('ocr_extractor', __name__, template_folder='templates')

@ocr_bp.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        if 'image' not in request.files:
            return 'No file part', 400

        file = request.files['image']
        if file.filename == '':
            return 'No selected file', 400

        if file and allowed_file(file.filename, ALLOWED_EXTENSIONS):
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)

            try:
                file.save(filepath)
                extracted_text = process_image(filepath)
                os.remove(filepath)

                if extracted_text is None:
                    return 'Error processing image', 500

                return extracted_text

            except Exception as e:
                if os.path.exists(filepath):
                    os.remove(filepath)
                return f'Error: {str(e)}', 500

        return 'Invalid file type', 400

    return render_template('index.html')


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
            create_text_file(text, output_path)
        elif format_type == 'pdf':
            create_pdf_file(text, output_path)
        elif format_type == 'docx':
            create_docx_file(text, output_path)
        else:
            return 'Invalid format type', 400

        return_data = send_file(output_path, as_attachment=True, download_name=filename)
        os.remove(output_path)
        return return_data

    except Exception as e:
        if os.path.exists(output_path):
            os.remove(output_path)
        return f'Error creating file: {str(e)}', 500


@ocr_bp.app_errorhandler(413)
def too_large(e):
    return 'File is too large', 413
