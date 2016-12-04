from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from apikit import obj_or_404, jsonify, request_data, arg_bool

from aleph.model import Entity, Collection, db
from aleph.logic import update_entity, delete_entity
from aleph.views.cache import enable_cache
from aleph.events import log_event
from aleph.search import QueryState
from aleph.search import entities_query, execute_entities_query
from aleph.search import suggest_entities, similar_entities

blueprint = Blueprint('entities_api', __name__)


@blueprint.route('/api/1/entities', methods=['GET'])
def index():
    enable_cache(vary_user=True)
    state = QueryState(request.args, request.authz)
    query = entities_query(state)
    query['size'] = state.limit
    query['from'] = state.offset
    doc_counts = state.getbool('doc_counts')
    res = execute_entities_query(state, query, doc_counts=doc_counts)
    return jsonify(res)


@blueprint.route('/api/1/entities/_all', methods=['GET'])
def all():
    collection_id = request.args.getlist('collection_id')
    collection_id = request.authz.collections_intersect(request.authz.READ, collection_id)  # noqa
    q = Entity.all_ids()
    q = q.filter(Entity.state == Entity.STATE_ACTIVE)
    q = q.filter(Entity.deleted_at == None)  # noqa
    q = q.filter(Entity.collection_id.in_(collection_id))
    return jsonify({'results': [r[0] for r in q]})


@blueprint.route('/api/1/entities', methods=['POST', 'PUT'])
def create():
    data = request_data()
    collection = Collection.by_id(data.get('collection_id'))
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
    entity = obj_or_404(Entity.by_id(id))
    request.authz.require(request.authz.collection_read(entity.collection_id))
    log_event(request, entity_id=entity.id)
    return jsonify(entity)


@blueprint.route('/api/1/entities/_suggest', methods=['GET'])
def suggest():
    enable_cache(vary_user=True, server_side=False)
    prefix = request.args.get('prefix')
    min_count = int(request.args.get('min_count', 0))
    return jsonify(suggest_entities(prefix, request.authz, min_count))


@blueprint.route('/api/1/entities/<id>/similar', methods=['GET'])
def similar(id):
    entity = obj_or_404(Entity.by_id(id))
    request.authz.require(request.authz.collection_read(entity.collection_id))
    return jsonify(similar_entities(entity))


@blueprint.route('/api/1/entities/<id>', methods=['POST', 'PUT'])
def update(id):
    entity = obj_or_404(Entity.by_id(id))
    request.authz.require(request.authz.collection_write(entity.collection_id))

    try:
        entity = Entity.save(request_data(),
                             entity.collection,
                             merge=arg_bool('merge'))
    except ValueError as ve:
        raise BadRequest(ve.message)

    entity.collection.touch()
    db.session.commit()
    log_event(request, entity_id=entity.id)
    update_entity(entity)
    return view(entity.id)


@blueprint.route('/api/1/entities/<id>/merge/<other_id>', methods=['DELETE'])
def merge(id, other_id):
    entity = obj_or_404(Entity.by_id(id))
    other = obj_or_404(Entity.by_id(other_id))
    request.authz.require(request.authz.collection_write(entity.collection_id))
    request.authz.require(request.authz.collection_write(other.collection_id))

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
    entity = obj_or_404(Entity.by_id(id))
    request.authz.require(request.authz.collection_write(entity.collection_id))
    delete_entity(entity)
    db.session.commit()
    log_event(request, entity_id=entity.id)
    return jsonify({'status': 'ok'})
