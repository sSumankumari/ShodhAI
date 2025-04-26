from flask import render_template, request, jsonify, send_file
from . import web_url_analyzer_bp
from .utils import extract_content, ask_groq
from .config import CONTENT_FILE, HISTORY_FILE, CONTENT_DIR
import os
import json
from dotenv import load_dotenv
import groq

load_dotenv()
client = groq.Groq(api_key=os.getenv('GROQ_API_KEY'))

history = {}

@web_url_analyzer_bp.route('/')
def index():
    return render_template('webURL_analyzer.html')


@web_url_analyzer_bp.route('/extract', methods=['POST'])
def extract():
    url = request.json.get('url')
    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        extract_content(url)
        if url not in history:
            history[url] = []
        return jsonify({"success": True, "message": "Content extracted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@web_url_analyzer_bp.route('/ask', methods=['POST'])
def ask():
    data = request.json
    question = data.get('question')
    url = data.get('url')

    if not question or not url:
        return jsonify({"error": "Question and URL are required"}), 400

    try:
        with open(CONTENT_FILE, 'r', encoding='utf-8') as f:
            content = f.read()

        response = ask_groq(question, content, client)

        if url not in history:
            history[url] = []
        history[url].append({"question": question, "answer": response})

        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f)

        return jsonify({"success": True, "answer": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@web_url_analyzer_bp.route('/history')
def get_history():
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                return jsonify({"success": True, "history": json.load(f)})
        return jsonify({"success": True, "history": {}})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@web_url_analyzer_bp.route('/content')
def get_content():
    try:
        if os.path.exists(CONTENT_FILE):
            with open(CONTENT_FILE, 'r', encoding='utf-8') as f:
                return jsonify({"success": True, "content": f.read()})
        return jsonify({"error": "Content file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@web_url_analyzer_bp.route('/download')
def download_content():
    try:
        if os.path.exists(CONTENT_FILE):
            return send_file(CONTENT_FILE, as_attachment=True, download_name='website_content.txt')
        return jsonify({"error": "Content file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
