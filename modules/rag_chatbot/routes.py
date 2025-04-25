from flask import request, jsonify, render_template, send_from_directory
from . import rag_pdf_chatbot_bp
from utils import to_markdown
import google.generativeai as genai

@rag_pdf_chatbot_bp.route('/')
def index():
    return render_template('templates/index.html')

@rag_pdf_chatbot_bp.route('/generate', methods=['POST'])
def generate():
    prompt = request.form['prompt']
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content(prompt)
    content = to_markdown(response.parts)
    return jsonify({'content': content})

@rag_pdf_chatbot_bp.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)
