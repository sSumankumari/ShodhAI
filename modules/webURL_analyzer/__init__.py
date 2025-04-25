from flask import Blueprint

web_url_analyzer_bp = Blueprint('webURL_analyzer', __name__, template_folder='templates')

from . import routes
