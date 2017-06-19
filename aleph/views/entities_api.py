from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from apikit import obj_or_404, jsonify, request_data, arg_bool

from aleph.core import db
from aleph.model import Entity, Collection
from aleph.logic import update_entity, delete_entity
from aleph.events import log_event
from aleph.search import LinksQuery, EntitiesQuery, EntityDocumentsQuery
from aleph.search import SuggestEntitiesQuery, SimilarEntitiesQuery
from aleph.views.util import get_entity
from aleph.views.cache import enable_cache

blueprint = Blueprint('entities_api', __name__)


@blueprint.route('/api/1/entities', methods=['GET'])
def index():
    enable_cache()
    result = EntitiesQuery.handle_request(request)
    return jsonify(result)


@blueprint.route('/api/1/entities/_all', methods=['GET'])
def all():
    collection_id = request.args.getlist('collection_id')
    collection_id = request.authz.collections_intersect(request.authz.READ, collection_id)  # noqa
    q = Entity.all_ids()
    q = q.filter(Entity.state == Entity.STATE_ACTIVE)
    q = q.filter(Entity.deleted_at == None)  # noqa
    q = q.filter(Entity.collection_id.in_(collection_id))
    return jsonify({'results': [r[0] for r in q]})


@blueprint.route('/api/1/entities/_suggest', methods=['GET'])
def suggest():
    enable_cache()
    result = SuggestEntitiesQuery.handle_request(request)
    return jsonify(result)


@blueprint.route('/api/1/entities', methods=['POST', 'PUT'])
def create():
    data = request_data()
    collection_id = data.get('collection_id')
    try:
        collection_id = int(collection_id)
    except (ValueError, TypeError) as ve:
        raise BadRequest("Invalid collection_id")
    collection = obj_or_404(Collection.by_id(collection_id))
    request.authz.require(request.authz.collection_write(collection.id))

    try:
        entity = Entity.save(data, collection)
    except (ValueError, TypeError) as ve:
        raise BadRequest(ve.message)

    entity.collection.touch()
    db.session.commit()
    log_event(request, entity_id=entity.id)
    update_entity(entity)
    return view(entity.id)


@blueprint.route('/api/1/entities/<id>', methods=['GET'])
def view(id):
    entity, obj = get_entity(id, request.authz.READ)
    log_event(request, entity_id=id)
    return jsonify(entity)


@blueprint.route('/api/1/entities/<id>/links', methods=['GET'])
def links(id):
    enable_cache()
    entity, obj = get_entity(id, request.authz.READ)
    result = LinksQuery.handle_request(request, entity=entity)
    return jsonify(result)


@blueprint.route('/api/1/entities/<id>/similar', methods=['GET'])
def similar(id):
    enable_cache()
    entity, _ = get_entity(id, request.authz.READ)
    result = SimilarEntitiesQuery.handle_request(request, entity=entity)
    return jsonify(result)


@blueprint.route('/api/1/entities/<id>/documents', methods=['GET'])
def documents(id):
    enable_cache()
    entity, _ = get_entity(id, request.authz.READ)
    result = EntityDocumentsQuery.handle_request(request, entity=entity)
    return jsonify(result)


@blueprint.route('/api/1/entities/<id>', methods=['POST', 'PUT'])
def update(id):
    _, entity = get_entity(id, request.authz.WRITE)

    try:
        entity = Entity.save(request_data(), entity.collection,
                             merge=arg_bool('merge'))
    except (ValueError, TypeError) as ve:
        raise BadRequest(ve.message)

    entity.collection.touch()
    db.session.commit()
    log_event(request, entity_id=entity.id)
    update_entity(entity)
    return view(entity.id)


@blueprint.route('/api/1/entities/<id>/merge/<other_id>', methods=['DELETE'])
def merge(id, other_id):
    _, entity = get_entity(id, request.authz.WRITE)
    _, other = get_entity(other_id, request.authz.WRITE)

    try:
        entity.merge(other)
    except ValueError as ve:
        raise BadRequest(ve.message)

    db.session.commit()
    log_event(request, entity_id=entity.id)
    update_entity(entity)
    update_entity(other)
    return view(entity.id)


@blueprint.route('/api/1/entities/<id>', methods=['DELETE'])
def delete(id):
    _, entity = get_entity(id, request.authz.WRITE)
    delete_entity(entity)
    db.session.commit()
    log_event(request, entity_id=entity.id)
    return jsonify({'status': 'ok'})
