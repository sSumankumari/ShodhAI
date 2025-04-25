from flask import Flask, render_template, request
import os
from werkzeug.utils import secure_filename

# Importing feature modules
from modules import (
    plagiarism_checker,
    classifier,
    rag_chatbot,
    ocr_extractor,
    youtube_analyzer,
    webURL_analyzer
)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ---------------------- ROUTES ----------------------

@app.route('/')
def home():
    return render_template('index.html')

# === Plagiarism Checker ===
# Route for the main page
@app.route('/')
def index():
    return render_template('index.html')


# API endpoint for processing PDFs
@app.route('/api/process', methods=['POST'])
def process_pdfs():
    if 'files[]' not in request.files:
        return jsonify({"error": "No files provided"}), 400

    files = request.files.getlist('files[]')
    if not files or len(files) < 2:
        return jsonify({"error": "Please upload at least 2 PDF files"}), 400

    # Filter for PDF files only
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


# API endpoint for downloading results as CSV
@app.route('/api/download/csv', methods=['POST'])
def download_csv():
    try:
        data = request.json
        results = data.get('results', [])

        if not results:
            return jsonify({"error": "No results to download"}), 400

        # Create a CSV in memory
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)

        # Create a temporary file to save the CSV
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.csv')
        with open(temp_file.name, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=results[0].keys())
            writer.writeheader()
            writer.writerows(results)

        return send_file(temp_file.name,
                         mimetype='text/csv',
                         as_attachment=True,
                         download_name=f'similarity_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Generate HTML report content
def generate_html_report(results, file_names):
    report_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    table_rows = ""
    for result in results:
        table_rows += f"""
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["Doc 1"]}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["Doc 2"]}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["Cosine_TFIDF"]}%</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["Cosine_Count"]}%</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["Jaccard"]}%</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["LCS"]}%</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["LSH"]}%</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["NGram"]}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">{result["Average Similarity (%)"]}%</td>
        </tr>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Document Similarity Report - {report_date}</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h1, h2 {{ color: #2563eb; }}
            table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
            th {{ background-color: #f1f5f9; text-align: left; padding: 12px; border: 1px solid #ddd; }}
            td {{ padding: 8px; border: 1px solid #ddd; }}
            tr:nth-child(even) {{ background-color: #f9fafb; }}
            .summary {{ margin-bottom: 20px; }}
        </style>
    </head>
    <body>
        <h1>Document Similarity Analysis Report</h1>
        <div class="summary">
            <p><strong>Generated on:</strong> {report_date}</p>
            <p><strong>Files analyzed:</strong> {len(file_names)}</p>
            <p><strong>File names:</strong> {', '.join(file_names)}</p>
        </div>

        <h2>Similarity Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Doc 1</th>
                    <th>Doc 2</th>
                    <th>Cosine_TFIDF (%)</th>
                    <th>Cosine_Count (%)</th>
                    <th>Jaccard (%)</th>
                    <th>LCS (%)</th>
                    <th>LSH (%)</th>
                    <th>NGram (%)</th>
                    <th>Average (%)</th>
                </tr>
            </thead>
            <tbody>
                {table_rows}
            </tbody>
        </table>

        <h2>Metrics Explanation</h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 25%;">Metric</th>
                    <th style="width: 75%;">Explanation</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Cosine TF-IDF</strong></td>
                    <td>Measures similarity by treating documents as vectors, with words weighted by their importance. Higher scores indicate documents share important terms, not just common words.</td>
                </tr>
                <tr>
                    <td><strong>Cosine Count</strong></td>
                    <td>Similar to Cosine TF-IDF but uses raw word counts instead of weighted values. Measures how similar the word distributions are between documents.</td>
                </tr>
                <tr>
                    <td><strong>Jaccard</strong></td>
                    <td>Compares the shared words between documents to the total unique words in both. Focuses on word overlap regardless of frequency or order.</td>
                </tr>
                <tr>
                    <td><strong>LCS</strong></td>
                    <td>Finds the longest sequence of words that appear in the same order in both documents. Good for detecting large blocks of identical text.</td>
                </tr>
                <tr>
                    <td><strong>LSH</strong></td>
                    <td>Uses hashing to quickly identify similar document segments. Effective for detecting partial matches and document sections that have been copied.</td>
                </tr>
                <tr>
                    <td><strong>NGram</strong></td>
                    <td>Compares sequences of consecutive words (typically 3-5 words) between documents. Good for identifying phrase-level similarity and paraphrasing.</td>
                </tr>
                <tr>
                    <td><strong>Average</strong></td>
                    <td>The mean of all similarity metrics, giving an overall indication of document similarity. Higher percentages suggest a greater likelihood of content overlap.</td>
                </tr>
            </tbody>
        </table>

        <div style="margin-top: 30px; color: #6b7280; font-size: 12px; text-align: center;">
            <p>Generated by DocSimilarity - PDF Document Similarity Analysis Tool</p>
        </div>
    </body>
    </html>
    """

    return html_content


# API endpoint for downloading results as HTML report
@app.route('/api/download/html', methods=['POST'])
def download_html():
    try:
        data = request.json
        results = data.get('results', [])
        file_names = data.get('fileNames', [])

        if not results:
            return jsonify({"error": "No results to download"}), 400

        # Generate HTML report
        html_content = generate_html_report(results, file_names)

        # Create a temporary file to save the HTML report
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.html')
        with open(temp_file.name, 'w', encoding='utf-8') as f:
            f.write(html_content)

        return send_file(temp_file.name,
                         mimetype='text/html',
                         as_attachment=True,
                         download_name=f'similarity_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.html')
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# === Document Classifier ===
@app.route('/classifier', methods=['GET', 'POST'])
def document_classifier():
    if request.method == 'POST':
        file = request.files['document']
        if file:
            filename = secure_filename(file.filename)
            path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(path)
            result = classifier.classify(path)
            return render_template('classifier.html', result=result)
    return render_template('classifier.html')

# === RAG Chatbot ===
@app.route('/')
def index():
    return render_template('templates/index.html')

@app.route('/generate', methods=['POST'])
def generate():
    prompt = request.form['prompt']
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content(prompt)
    content = to_markdown(response.parts)
    return jsonify({'content': content})

# Ensure that CSS and JS files are correctly served
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# === OCR Extractor ===
@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        # Check if the post request has the file part
        if 'image' not in request.files:
            return 'No file part', 400

        file = request.files['image']

        # If user doesn't select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            return 'No selected file', 400

        if file and allowed_file(file.filename):
            # Secure the filename
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

            try:
                # Save the file temporarily
                file.save(filepath)

                # Process the image
                extracted_text = process_image(filepath)

                # Clean up the uploaded file
                os.remove(filepath)

                if extracted_text is None:
                    return 'Error processing image', 500

                return extracted_text

            except Exception as e:
                # Clean up on error
                if os.path.exists(filepath):
                    os.remove(filepath)
                return f'Error: {str(e)}', 500

        return 'Invalid file type', 400

    return render_template('index.html')


@app.route('/download', methods=['POST'])
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
        # Create file based on requested format
        if format_type == 'txt':
            create_text_file(text, output_path)
        elif format_type == 'pdf':
            create_pdf_file(text, output_path)
        elif format_type == 'docx':
            create_docx_file(text, output_path)
        else:
            return 'Invalid format type', 400

        # Send file to user
        return_data = send_file(
            output_path,
            as_attachment=True,
            download_name=filename
        )

        # Clean up after sending
        os.remove(output_path)

        return return_data

    except Exception as e:
        if os.path.exists(output_path):
            os.remove(output_path)
        return f'Error creating file: {str(e)}', 500


@app.errorhandler(413)
def too_large(e):
    return 'File is too large', 413


# === YouTube Transcript Analyzer ===
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/extract-transcript', methods=['POST'])
def extract_transcript():
    data = request.json
    youtube_url = data.get('url')

    if not youtube_url:
        return jsonify({'success': False, 'error': 'No YouTube URL provided'})

    # Extract new transcript
    try:
        result = get_transcript(youtube_url)
        if not result['success']:
            return jsonify({'success': False, 'error': result['error']})

        # Save base transcript
        save_success = save_transcript_to_file(result['transcript'], transcript_file)
        if not save_success:
            return jsonify({'success': False, 'error': 'Failed to save transcript'})

        # Try extracting transcript with timestamps
        timestamp_result = get_transcript_with_timestamps(youtube_url)
        if timestamp_result['success']:
            save_transcript_to_file(timestamp_result['transcript'], timestamp_file)
            transcript_text = timestamp_result['transcript']
        else:
            transcript_text = result['transcript']

        return jsonify({'success': True, 'transcript': transcript_text})

    except Exception as e:
        return jsonify({'success': False, 'error': f"An error occurred: {str(e)}"})


@app.route('/api/ask-question', methods=['POST'])
def ask_question():
    data = request.json
    question = data.get('question')

    if not question:
        return jsonify({'suc  cess': False, 'error': 'No question provided'})

    # Load transcript dynamically from file OR from request
    transcript_text = data.get('transcript')

    # If transcript wasn't sent in request, try to load it from file
    if not transcript_text:
        transcript_text = load_transcript()

    if not transcript_text:
        return jsonify({'success': False, 'error': 'No transcript found. Please extract the transcript first.'})

    try:
        answer = ask_groq(question, client=client, transcript_text=transcript_text)
        return jsonify({'success': True, 'answer': answer})
    except Exception as e:
        return jsonify({'success': False, 'error': f"An error occurred: {str(e)}"})


@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)


# === Web URL Analyzer ===
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/extract', methods=['POST'])
def extract():
    data = request.json
    url = data.get('url')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        # Extract content from the URL
        url_info = extract_content(url)

        # Initialize chat history for this URL
        if url not in history:
            history[url] = []

        return jsonify({"success": True, "message": "Content extracted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/ask', methods=['POST'])
def ask():
    data = request.json
    question = data.get('question')
    url = data.get('url')

    if not question or not url:
        return jsonify({"error": "Question and URL are required"}), 400

    try:
        # Read content from file
        with open(CONTENT_FILE, 'r', encoding='utf-8') as f:
            content = f.read()

        # Get response from Groq
        response = ask_groq(question, content, client)

        # Add to history
        if url not in history:
            history[url] = []

        history[url].append({"question": question, "answer": response})

        # Save history to JSON file
        os.makedirs(CONTENT_DIR, exist_ok=True)
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f)

        return jsonify({"success": True, "answer": response}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/history')
def get_history():
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                history_data = json.load(f)
                return jsonify({"success": True, "history": history_data}), 200
        else:
            return jsonify({"success": True, "history": {}}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/content')
def get_content():
    try:
        if os.path.exists(CONTENT_FILE):
            with open(CONTENT_FILE, 'r', encoding='utf-8') as f:
                content = f.read()
            return jsonify({"success": True, "content": content}), 200
        else:
            return jsonify({"error": "Content file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/download')
def download_content():
    try:
        if os.path.exists(CONTENT_FILE):
            return send_file(CONTENT_FILE,
                             as_attachment=True,
                             download_name='website_content.txt')
        else:
            return jsonify({"error": "Content file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------- MAIN ----------------------
if __name__ == '__main__':
    app.run(debug=True)
