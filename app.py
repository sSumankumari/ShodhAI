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
@app.route('/plagiarism_checker', methods=['GET', 'POST'])
def plagiarism_check():
    if request.method == 'POST':
        file = request.files['document']
        if file:
            filename = secure_filename(file.filename)
            path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(path)
            result = plagiarism_checker.check(path)
            return render_template('plagiarism_checker.html', result=result)
    return render_template('plagiarism_checker.html')

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
@app.route('/rag_chatbot', methods=['GET', 'POST'])
def rag_pdf_chat():
    if request.method == 'POST':
        file = request.files['document']
        query = request.form.get('query', '')
        if file and query:
            filename = secure_filename(file.filename)
            path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(path)
            response = rag_chatbot.query_pdf(path, query)
            return render_template('rag_chatbot.html', response=response, query=query)
    return render_template('rag_chatbot.html')

# === OCR Extractor ===
@app.route('/ocr_extractor', methods=['GET', 'POST'])
def ocr_extract():
    if request.method == 'POST':
        image = request.files['image']
        if image:
            filename = secure_filename(image.filename)
            path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image.save(path)
            extracted_text = ocr_extractor.extract_text(path)
            return render_template('ocr_extractor.html', text=extracted_text)
    return render_template('ocr_extractor.html')

# === YouTube Transcript Analyzer ===
@app.route('/YTtranscript_analyzer', methods=['GET', 'POST'])
def youtube_transcript():
    if request.method == 'POST':
        url = request.form['video_url']
        query = request.form.get('query', '')
        transcript, summary, answer = youtube_analyzer.analyze_video(url, query)
        return render_template('YTtranscript_analyzer.html', transcript=transcript, summary=summary, answer=answer)
    return render_template('YTtranscript_analyzer.html')

# === Web URL Analyzer ===
@app.route('/webURL_analyzer', methods=['GET', 'POST'])
def weburl_analyze():
    if request.method == 'POST':
        url = request.form['web_url']
        query = request.form.get('query', '')
        content, summary, answer = weburl_analyzer.analyze(url, query)
        return render_template('webURL_analyzer.html', content=content, summary=summary, answer=answer)
    return render_template('webURL_analyzer.html')

# ---------------------- MAIN ----------------------
if __name__ == '__main__':
    app.run(debug=True)
