from flask import Blueprint

web_url_analyzer_bp = Blueprint(
    'webURL_analyzer',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/weburl/static'
)

from . import routes
