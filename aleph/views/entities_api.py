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


def check_authz(entity, permission):
    permissions = request.authz.collections.get(permission)
    for collection in entity.collections:
        if collection.id in permissions:
            return
    request.authz.require(False)


def get_collections(data):
    collections = []
    collection_id = data.get('collection_id') or []
    if not isinstance(collection_id, (list, set, tuple)):
        collection_id = [collection_id]
    for coll_id in collection_id:
        if isinstance(coll_id, dict):
            coll_id = coll_id.get('id')
        collections.append(coll_id)
    return Collection.all_by_ids(collections).all()


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
    clause = Collection.id.in_(collection_id)
    q = q.filter(Entity.collections.any(clause))
    return jsonify({'results': [r[0] for r in q]})


@blueprint.route('/api/1/entities', methods=['POST', 'PUT'])
def create():
    data = request_data()
    data.pop('id', None)
    collections = get_collections(data)
    for collection in collections:
        request.authz.require(request.authz.collection_write(collection.id))

    try:
        entity = Entity.save(data, collections)
    except ValueError as ve:
        raise BadRequest(ve.message)
    for collection in entity.collections:
        collection.touch()
    db.session.commit()
    log_event(request, entity_id=entity.id)
    update_entity(entity)
    return view(entity.id)


@blueprint.route('/api/1/entities/<id>', methods=['GET'])
def view(id):
    entity = obj_or_404(Entity.by_id(id))
    check_authz(entity, request.authz.READ)
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
    check_authz(entity, request.authz.READ)
    return jsonify(similar_entities(entity, request.authz,
                                    writeable=arg_bool('writeable')))


@blueprint.route('/api/1/entities/<id>', methods=['POST', 'PUT'])
def update(id):
    entity = obj_or_404(Entity.by_id(id))
    check_authz(entity, request.authz.WRITE)
    data = request_data()
    data['id'] = entity.id
    possible_collections = request.authz.collections_write
    possible_collections.extend([c.id for c in entity.collections])
    collections = [c for c in get_collections(data)
                   if c.id in possible_collections]
    try:
        entity = Entity.save(data, collections, merge=arg_bool('merge'))
    except ValueError as ve:
        raise BadRequest(ve.message)
    for collection in entity.collections:
        collection.touch()
    db.session.commit()
    log_event(request, entity_id=entity.id)
    update_entity(entity)
    return view(entity.id)


@blueprint.route('/api/1/entities/<id>/merge/<other_id>', methods=['DELETE'])
def merge(id, other_id):
    entity = obj_or_404(Entity.by_id(id))
    check_authz(entity, request.authz.WRITE)
    other = obj_or_404(Entity.by_id(other_id))
    check_authz(other, request.authz.WRITE)
    entity.merge(other)
    db.session.commit()
    update_entity(entity)
    update_entity(other)
    log_event(request, entity_id=entity.id)
    return view(entity.id)


@blueprint.route('/api/1/entities/<id>', methods=['DELETE'])
def delete(id):
    entity = obj_or_404(Entity.by_id(id))
    check_authz(entity, request.authz.WRITE)
    delete_entity(entity)
    db.session.commit()
    log_event(request, entity_id=entity.id)
    return jsonify({'status': 'ok'})
