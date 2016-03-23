from flask import Blueprint, request
from apikit import obj_or_404, jsonify, Pager, request_data

from aleph import authz
from aleph.model import Entity, db
from aleph.analyze import analyze_entity
from aleph.views.cache import enable_cache
from aleph.views.util import match_ids

blueprint = Blueprint('entities_api', __name__)


@blueprint.route('/api/1/entities', methods=['GET'])
def index():
    collection_ids = match_ids('collection', authz.collections(authz.READ))
    q = Entity.by_lists(collection_ids, prefix=request.args.get('prefix'))
    return jsonify(Pager(q))


@blueprint.route('/api/1/entities', methods=['POST', 'PUT'])
def create():
    data = request_data()
    collection = data.get('collection')
    authz.require(collection)
    authz.require(authz.collection_write(collection.id))
    entity = Entity.create(data)
    collection.touch()
    db.session.commit()
    analyze_entity.delay(entity.id)
    return view(entity.id)


@blueprint.route('/api/1/entities/_suggest', methods=['GET'])
def suggest():
    collections = authz.collections(authz.READ)
    enable_cache(vary=collections, server_side=False)
    prefix = request.args.get('prefix')
    results = Entity.suggest_prefix(prefix, collections)
    return jsonify({'results': results})


@blueprint.route('/api/1/entities/<int:id>', methods=['GET'])
def view(id):
    entity = obj_or_404(Entity.by_id(id))
    authz.require(authz.collection_read(entity.collection_id))
    return jsonify(entity)


@blueprint.route('/api/1/entities/<int:id>', methods=['POST', 'PUT'])
def update(id):
    entity = obj_or_404(Entity.by_id(id))
    authz.require(authz.collection_write(entity.collection_id))
    data = request_data()
    collection = data.get('collection')
    authz.require(collection)
    authz.require(authz.collection_write(collection.id))
    entity.update(data)
    collection.touch()
    db.session.commit()
    analyze_entity.delay(entity.id)
    return view(entity.id)


@blueprint.route('/api/1/entities/<int:id>', methods=['DELETE'])
def delete(id):
    entity = obj_or_404(Entity.by_id(id))
    authz.require(authz.collection_write(entity.collection_id))
    entity.delete()
    db.session.commit()
    analyze_entity.delay(id)
    return jsonify({'status': 'ok'})
