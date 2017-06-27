from flask import Blueprint, request
from apikit import obj_or_404, jsonify, request_data
from werkzeug.exceptions import BadRequest

from aleph.model import Collection, EntityIdentity
from aleph.search import LeadsQuery
from aleph.logic import update_entity, update_lead
from aleph.views.util import get_entity, require

blueprint = Blueprint('leads_api', __name__)


@blueprint.route('/api/2/collections/<int:collection_id>/leads',
                 methods=['GET'])
def index(collection_id):
    collection = obj_or_404(Collection.by_id(collection_id))
    require(request.authz.can_read(collection))
    result = LeadsQuery.handle_request(request, collection_id=collection_id)
    return jsonify(result)


@blueprint.route('/api/2/collections/<int:collection_id>/leads',
                 methods=['POST', 'PUT'])
def update(collection_id):
    collection = obj_or_404(Collection.by_id(collection_id))
    require(request.authz.can_write(collection))
    data = request_data()
    entity, obj = get_entity(data.get('entity_id'), request.authz.WRITE)
    if obj.collection_id != collection_id:
        raise BadRequest("Entity does not belong to collection.")

    match, _ = get_entity(data.get('match_id'), request.authz.READ)
    judgement = data.get('judgement')
    if judgement not in EntityIdentity.JUDGEMENTS:
        raise BadRequest("Invalid judgement.")
    update_lead(entity, match, judgement, judge=request.authz.role)
    update_entity(obj)
    return jsonify({'status': 'ok'})
