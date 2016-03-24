from flask import Blueprint, request
from apikit import obj_or_404, jsonify, Pager, request_data

from aleph import authz
from aleph.model import Entity, db
from aleph.analyze import analyze_entity
from aleph.views.cache import enable_cache
from aleph.views.util import match_ids

blueprint = Blueprint('entities_api', __name__)


def get_data(entity=None):
    data = request_data()
    collection_id = data.get('collection_id')
    collection_id = entity.collection_id if entity else collection_id
    authz.require(authz.collection_write(collection_id))
    data['id'] = entity.id if entity else None
    return data


@blueprint.route('/api/1/entities', methods=['GET'])
def index():
    collection_ids = match_ids('collection', authz.collections(authz.READ))
    q = Entity.all()
    q = q.filter(Entity.collection_id.in_(collection_ids))
    return jsonify(Pager(q))


@blueprint.route('/api/1/entities', methods=['POST', 'PUT'])
def create():
    entity = Entity.save(get_data())
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
    entity = Entity.save(get_data(entity=entity))
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
