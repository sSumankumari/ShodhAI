from flask import Blueprint, request, jsonify, send_file, render_template
from processor import process_uploaded_pdfs, compare_pdfs
from report_generator import generate_html_report
import tempfile
import csv
import io
from datetime import datetime

plagiarism_bp = Blueprint('plagiarism_checker', __name__, template_folder='templates')

@plagiarism_bp.route('/')
def index():
    return render_template('index.html')

@plagiarism_bp.route('/api/process', methods=['POST'])
def process_pdfs():
    if 'files[]' not in request.files:
        return jsonify({"error": "No files provided"}), 400

    files = request.files.getlist('files[]')
    pdf_files = [f for f in files if f.filename.lower().endswith('.pdf')]
    if len(pdf_files) < 2:
        return jsonify({"error": "Please upload at least 2 PDF files"}), 400

    try:
        results = process_uploaded_pdfs(pdf_files)
        return jsonify({
            "results": results,
            "fileCount": len(pdf_files),
            "fileNames": [f.filename for f in pdf_files]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@plagiarism_bp.route('/api/download/csv', methods=['POST'])
def download_csv():
    try:
        data = request.json
        results = data.get('results', [])
        if not results:
            return jsonify({"error": "No results to download"}), 400

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.csv')
        with open(temp_file.name, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=results[0].keys())
            writer.writeheader()
            writer.writerows(results)

        return send_file(temp_file.name, mimetype='text/csv',
                         as_attachment=True,
                         download_name=f'similarity_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@plagiarism_bp.route('/api/download/html', methods=['POST'])
def download_html():
    try:
        data = request.json
        results = data.get('results', [])
        file_names = data.get('fileNames', [])
        if not results:
            return jsonify({"error": "No results to download"}), 400

        html_content = generate_html_report(results, file_names)
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.html')
        with open(temp_file.name, 'w', encoding='utf-8') as f:
            f.write(html_content)

        return send_file(temp_file.name, mimetype='text/html',
                         as_attachment=True,
                         download_name=f'similarity_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.html')
    except Exception as e:
        return jsonify({"error": str(e)}), 500
