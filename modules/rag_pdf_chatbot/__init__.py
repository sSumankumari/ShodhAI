from flask import Blueprint

rag_pdf_chatbot_bp = Blueprint(
    'rag_pdf_chatbot',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/rag-pdf/static'
)

from . import routes
