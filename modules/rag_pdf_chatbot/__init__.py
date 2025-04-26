from flask import Blueprint

rag_pdf_chatbot_bp = Blueprint('rag_pdf', __name__, template_folder='templates')

from . import routes
