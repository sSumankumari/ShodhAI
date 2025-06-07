from flask import (
    Flask, render_template, request, jsonify, send_file, redirect, url_for
)
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Import feature modules
from features.ocr_extractor import extract_text_from_file
from features.plagiarism_checker import check_plagiarism_from_files, check_plagiarism_from_strings
from features.rag_pdf_chatbot import answer_from_pdf
from features.webURL_analyzer import analyze as web_analyze
from features.youtube_analyzer import (
    extract_and_save_transcript, ask_question_over_transcript, summarize_transcript
)

# Groq/OpenAI client (if needed)
try:
    from groq import Groq
    groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
except ImportError:
    groq_client = None

app = Flask(__name__, template_folder='templates', static_folder='static')

# ========== OCR ROUTES ==========

@app.route('/ocr', methods=['GET', 'POST'])
def ocr():
    if request.method == 'POST':
        file = request.files.get('image')
        if not file or file.filename == '':
            return render_template('ocr.html', error="No file selected.")
        try:
            file.stream.seek(0)
            text = extract_text_from_file(file.stream)
            return render_template('ocr.html', extracted_text=text)
        except Exception as e:
            return render_template('ocr.html', error=str(e))
    return render_template('ocr.html')

# ========== PLAGIARISM CHECKER ROUTES ==========

@app.route('/plagiarism', methods=['GET', 'POST'])
def plagiarism():
    if request.method == 'POST':
        files = request.files.getlist('files[]')
        if len(files) < 2:
            return render_template('plagiarism.html', error="Please upload at least 2 files.")
        file_names = [f.filename for f in files]
        try:
            results = check_plagiarism_from_files(files, file_names)
            return render_template('plagiarism.html', results=results, file_names=file_names)
        except Exception as e:
            return render_template('plagiarism.html', error=str(e))
    return render_template('plagiarism.html')

# ========== RAG PDF CHATBOT ROUTES ==========

@app.route('/rag_pdf', methods=['GET', 'POST'])
def rag_pdf():
    answer = None
    if request.method == 'POST':
        pdf = request.files.get('pdf')
        question = request.form.get('question')
        if not pdf or not question:
            return render_template('rag_pdf.html', error="PDF and question required.")
        try:
            pdf.stream.seek(0)
            answer = answer_from_pdf(pdf, question, temperature=0.2)
        except Exception as e:
            return render_template('rag_pdf.html', error=str(e))
    return render_template('rag_pdf.html', answer=answer)

# ========== WEB URL ANALYZER ROUTES ==========

@app.route('/web_analyze', methods=['GET', 'POST'])
def weburl_analyze():
    result = None
    if request.method == 'POST':
        url = request.form.get('url')
        question = request.form.get('question')
        if not url:
            return render_template('web_analyze.html', error="URL required.")
        try:
            result = web_analyze(url, question, GROQ_API_KEY)
        except Exception as e:
            return render_template('web_analyze.html', error=str(e))
        if "error" in result:
            return render_template('web_analyze.html', error=result["error"])
    return render_template('web_analyze.html', result=result)

# ========== YOUTUBE ANALYZER ROUTES ==========

@app.route('/youtube', methods=['GET', 'POST'])
def youtube_analyzer():
    transcript = None
    answer = None
    summary = None
    if request.method == 'POST':
        action = request.form.get('action')
        youtube_url = request.form.get('url')
        question = request.form.get('question')
        if action == 'extract':
            result = extract_and_save_transcript(youtube_url)
            if result['success']:
                transcript = result['transcript']
            else:
                return render_template('youtube.html', error=result['error'])
        if action == 'ask':
            result = ask_question_over_transcript(question, client=groq_client)
            if result['success']:
                answer = result['answer']
            else:
                return render_template('youtube.html', error=result['error'])
        if action == 'summarize':
            transcript_text = request.form.get('transcript')
            result = summarize_transcript(transcript_text, client=groq_client)
            if result['success']:
                summary = result['summary']
            else:
                return render_template('youtube.html', error=result['error'])
    return render_template('youtube.html', transcript=transcript, answer=answer, summary=summary)

# ========== HOME ==========

@app.route('/')
def home():
    return render_template('index.html')

# ========== STATIC FILES ==========

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_file(os.path.join(app.static_folder, filename))

# ========== ERROR HANDLERS ==========

@app.errorhandler(413)
def too_large(e):
    return "File is too large", 413

@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(e):
    return render_template('500.html'), 500

# ========== MAIN ==========

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)