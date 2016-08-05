from flask import Blueprint, request
from apikit import obj_or_404, jsonify, request_data, arg_bool
from apikit import get_limit, get_offset

from aleph import authz
from aleph.model import Entity, Collection, db
from aleph.logic import update_entity
from aleph.views.cache import enable_cache
from aleph.events import log_event
from aleph.search import entities_query, execute_entities_query
from aleph.search import suggest_entities, similar_entities

blueprint = Blueprint('entities_api', __name__)


def check_authz(entity, permission):
    permissions = authz.collections(permission)
    for collection in entity.collections:
        if collection.id in permissions:
            return
    authz.require(False)


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
    q = entities_query(request.args)
    q['size'] = get_limit(default=50)
    q['from'] = get_offset()
    doc_counts = arg_bool('doc_counts')
    res = execute_entities_query(request.args, q, doc_counts=doc_counts)
    return jsonify(res)


@blueprint.route('/api/1/entities/_all', methods=['GET'])
def all():
    collections = authz.collections(authz.READ)
    if len(request.args.getlist('collection_id')):
        colls = [int(c) for c in request.args.getlist('collection_id')]
        collections = [c for c in colls if c in collections]
    q = Entity.all_ids()
    q = q.filter(Entity.state == Entity.STATE_ACTIVE)
    q = q.filter(Entity.deleted_at == None)  # noqa
    clause = Collection.id.in_(collections)
    q = q.filter(Entity.collections.any(clause))
    return jsonify({'results': [r[0] for r in q]})


@blueprint.route('/api/1/entities', methods=['POST', 'PUT'])
def create():
    data = request_data()
    data.pop('id', None)
    collections = get_collections(data)
    for collection in collections:
        authz.require(authz.collection_write(collection.id))

    entity = Entity.save(data, collections)
    for collection in entity.collections:
        collection.touch()
    db.session.commit()
    log_event(request, entity_id=entity.id)
    update_entity(entity)
    return view(entity.id)


@blueprint.route('/api/1/entities/_suggest', methods=['GET'])
def suggest():
    collections = authz.collections(authz.READ)
    enable_cache(vary=collections, server_side=False)
    prefix = request.args.get('prefix')
    min_count = int(request.args.get('min_count', 0))
    return jsonify(suggest_entities(prefix, min_count))


@blueprint.route('/api/1/entities/<id>', methods=['GET'])
def view(id):
    entity = obj_or_404(Entity.by_id(id))
    check_authz(entity, authz.READ)
    log_event(request, entity_id=entity.id)
    return jsonify(entity)


@blueprint.route('/api/1/entities/<id>/similar', methods=['GET'])
def similar(id):
    entity = obj_or_404(Entity.by_id(id))
    check_authz(entity, authz.READ)
    action = authz.WRITE if arg_bool('writeable') else authz.READ
    collections = authz.collections(action)
    return jsonify(similar_entities(entity, request.args, collections))


@blueprint.route('/api/1/entities/_lookup', methods=['GET'])
def lookup():
    entity = obj_or_404(Entity.by_identifier(request.args.get('scheme'),
                                             request.args.get('identifier')))
    check_authz(entity, authz.READ)
    return jsonify(entity)


@blueprint.route('/api/1/entities/<id>', methods=['POST', 'PUT'])
def update(id):
    entity = obj_or_404(Entity.by_id(id))
    check_authz(entity, authz.WRITE)
    data = request_data()
    data['id'] = entity.id
    possible_collections = authz.collections(authz.WRITE)
    possible_collections.extend([c.id for c in entity.collections])
    collections = [c for c in get_collections(data)
                   if c.id in possible_collections]
    entity = Entity.save(data, collections, merge=arg_bool('merge'))
    for collection in entity.collections:
        collection.touch()
    db.session.commit()
    log_event(request, entity_id=entity.id)
    update_entity(entity)
    return view(entity.id)


@blueprint.route('/api/1/entities/<id>/merge/<other_id>', methods=['DELETE'])
def merge(id, other_id):
    entity = obj_or_404(Entity.by_id(id))
    check_authz(entity, authz.WRITE)
    other = obj_or_404(Entity.by_id(other_id))
    check_authz(other, authz.WRITE)
    entity.merge(other)
    db.session.commit()
    update_entity(entity)
    update_entity(other)
    log_event(request, entity_id=entity.id)
    return view(entity.id)


@blueprint.route('/api/1/entities/<id>', methods=['DELETE'])
def delete(id):
    entity = obj_or_404(Entity.by_id(id))
    check_authz(entity, authz.WRITE)
    entity.delete()
    db.session.commit()
    update_entity(entity)
    log_event(request, entity_id=entity.id)
    return jsonify({'status': 'ok'})
