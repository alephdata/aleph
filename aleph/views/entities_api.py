from flask import Blueprint

from aleph.views.util import jsonify

blueprint = Blueprint('entities', __name__)


@blueprint.route('/api/1/entities/_suggest', methods=['GET'])
def suggest():
    return jsonify({'results': [], 'total': 0})
