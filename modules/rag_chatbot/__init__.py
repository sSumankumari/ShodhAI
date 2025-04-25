from flask import Blueprint

rag_pdf_chatbot_bp = Blueprint('rag_pdf_chatbot', __name__, template_folder='templates')

from . import routes
