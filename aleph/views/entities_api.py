from flask import Blueprint, request

from aleph.views.util import jsonify
from aleph.model import Entity
from aleph import authz

blueprint = Blueprint('entities', __name__)


@blueprint.route('/api/1/entities/_suggest', methods=['GET'])
def suggest():
    lists = authz.authz_lists('read')
    prefix = request.args.get('prefix')
    results = Entity.suggest_prefix(prefix, lists)
    return jsonify({'results': results})
