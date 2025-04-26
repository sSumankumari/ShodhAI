from flask import Blueprint, request, jsonify, render_template, send_from_directory
from .utils import handle_transcript_extraction, handle_question
import os

youtube_bp = Blueprint(
    'YTtranscript_analyzer',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/yt-transcript/static'
)

@youtube_bp.route('/')
def index():
    return render_template('YTtranscript_analyzer.html')

@youtube_bp.route('/api/extract-transcript', methods=['POST'])
def extract_transcript():
    data = request.json
    youtube_url = data.get('url')

    if not youtube_url:
        return jsonify({'success': False, 'error': 'No YouTube URL provided'})

    result = handle_transcript_extraction(youtube_url)
    return jsonify(result)

@youtube_bp.route('/api/ask-question', methods=['POST'])
def ask_question():
    data = request.json
    question = data.get('question')

    if not question:
        return jsonify({'success': False, 'error': 'No question provided'})

    transcript_text = data.get('transcript')
    result = handle_question(question, transcript_text)
    return jsonify(result)

@youtube_bp.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)
