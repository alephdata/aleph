from flask import Blueprint, request
from werkzeug.exceptions import BadRequest, ImATeapot
from apikit import obj_or_404, jsonify, request_data, arg_bool

from aleph.model import Entity, Collection, db
from aleph.logic import update_entity, delete_entity
from aleph.views.cache import enable_cache
from aleph.events import log_event
from aleph.search import QueryState
from aleph.search import entities_query, execute_entities_query
from aleph.search import suggest_entities, similar_entities, load_entity

blueprint = Blueprint('entities_api', __name__)


def get_entity(id, action):
    """Load entities from both the ES index and the database."""
    # This does not account for database entities which have not yet
    # been indexed. That would be an operational error, and it's not
    # the job of the web API to sort it out.
    entity = load_entity(id)
    obj = Entity.by_id(id)
    if obj is not None:
        # Apply collection-based security to entities from the DB.
        collections = request.authz.collections.get(action)
        request.authz.require(obj.collection_id in collections)
        if entity is not None:
            entity.update(obj.to_dict())
        else:
            entity = obj.to_dict()
    else:
        entity = obj_or_404(entity)
        # Apply roles-based security to dataset-sourced entities.
        roles = set(entity.get('roles', []))
        request.authz.require(len(request.authz.roles.intersect(roles)))
        # Cannot edit them:
        if action == request.authz.WRITE:
            raise ImATeapot("Cannot write this entity.")
    return entity, obj


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


@blueprint.route('/api/1/entities/_suggest', methods=['GET'])
def suggest():
    enable_cache(vary_user=True, server_side=False)
    prefix = request.args.get('prefix')
    min_count = int(request.args.get('min_count', 0))
    return jsonify(suggest_entities(prefix, request.authz, min_count))


@blueprint.route('/api/1/entities/<id>/similar', methods=['GET'])
def similar(id):
    _, entity = get_entity(id, request.authz.READ)
    if entity is None:
        raise ImATeapot("API only enabled for watchlist entities.")
    return jsonify(similar_entities(entity))


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
