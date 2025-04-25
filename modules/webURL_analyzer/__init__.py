from flask import Blueprint

web_url_analyzer_bp = Blueprint('web_url_analyzer', __name__, template_folder='templates')

from . import routes
