from flask import Blueprint, request
from apikit import obj_or_404, jsonify, request_data, arg_bool
from apikit import get_limit, get_offset

from aleph import authz
from aleph.model import Entity, db
from aleph.graph import update_entity
from aleph.views.cache import enable_cache
from aleph.search import entities_query, execute_entities_query

blueprint = Blueprint('entities_api', __name__)


def get_data(entity=None):
    data = request_data()
    collection_id = data.get('collection_id')
    collection_id = entity.collection_id if entity else collection_id
    authz.require(authz.collection_write(collection_id))
    if entity is not None:
        data['id'] = entity.id
    else:
        data.pop('id', None)
    return data


@blueprint.route('/api/1/entities', methods=['GET'])
def index():
    q = entities_query(request.args)
    q['size'] = get_limit(default=50)
    q['from'] = get_offset()
    return jsonify(execute_entities_query(request.args, q))


@blueprint.route('/api/1/entities', methods=['POST', 'PUT'])
def create():
    data = get_data()
    entity = Entity.save(data, collection_id=data.get('collection_id'))
    db.session.commit()
    update_entity(entity)
    return view(entity.id)


@blueprint.route('/api/1/entities/_suggest', methods=['GET'])
def suggest():
    collections = authz.collections(authz.READ)
    enable_cache(vary=collections, server_side=False)
    prefix = request.args.get('prefix')
    results = Entity.suggest_prefix(prefix, collections)
    return jsonify({'results': results})


@blueprint.route('/api/1/entities/<id>', methods=['GET'])
def view(id):
    entity = obj_or_404(Entity.by_id(id))
    authz.require(authz.collection_read(entity.collection_id))
    return jsonify(entity)


@blueprint.route('/api/1/entities/_lookup', methods=['GET'])
def lookup():
    entity = obj_or_404(Entity.by_identifier(request.args.get('scheme'),
                                             request.args.get('identifier')))
    authz.require(authz.collection_read(entity.collection_id))
    return jsonify(entity)


@blueprint.route('/api/1/entities/<id>', methods=['POST', 'PUT'])
def update(id):
    entity = obj_or_404(Entity.by_id(id))
    entity = Entity.save(get_data(entity=entity),
                         collection_id=entity.collection_id,
                         merge=arg_bool('merge'))
    db.session.commit()
    update_entity(entity)
    return view(entity.id)


@blueprint.route('/api/1/entities/<id>', methods=['DELETE'])
def delete(id):
    entity = obj_or_404(Entity.by_id(id))
    authz.require(authz.collection_write(entity.collection_id))
    entity.delete()
    db.session.commit()
    update_entity(entity)
    return jsonify({'status': 'ok'})
