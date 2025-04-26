from flask import Flask, render_template, jsonify
from flask_cors import CORS
from modules.plagiarism_checker.routes import plagiarism_bp
from modules.rag_pdf_chatbot.routes import rag_pdf_chatbot_bp
from modules.webURL_analyzer.routes import web_url_analyzer_bp
from modules.youtube_analyzer.routes import youtube_bp
from modules.ocr_extractor.routes import ocr_bp

import warnings
warnings.filterwarnings("ignore")


# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Set max upload size
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload size

# Register blueprints for different modules
app.register_blueprint(plagiarism_bp, url_prefix='/plagiarism')
app.register_blueprint(rag_pdf_chatbot_bp, url_prefix='/rag-pdf')
app.register_blueprint(web_url_analyzer_bp, url_prefix='/weburl')
app.register_blueprint(youtube_bp, url_prefix='/yt-transcript')
app.register_blueprint(ocr_bp, url_prefix='/ocr')

# Home route to render the index page
@app.route('/')
def home():
    return render_template('index.html')

# Error handlers
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large. Maximum size is 50MB.'}), 413

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found.'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error.'}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)