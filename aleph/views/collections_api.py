from flask import Blueprint, request
from apikit import obj_or_404, jsonify, Pager, request_data

from aleph import authz
from aleph.core import USER_QUEUE, USER_ROUTING_KEY
from aleph.model import Collection, Path, db
from aleph.events import log_event
from aleph.views.cache import enable_cache
from aleph.logic import delete_collection, update_collection
from aleph.analyze import analyze_collection
from aleph.text import latinize_text

blueprint = Blueprint('collections_api', __name__)


@blueprint.route('/api/1/collections', methods=['GET'])
def index():
    collections = authz.collections(authz.READ)
    enable_cache(vary_user=True, vary=collections)
    q = Collection.all_by_ids(collections)
    q = q.order_by(Collection.label.asc())
    return jsonify(Pager(q))


@blueprint.route('/api/1/collections', methods=['POST', 'PUT'])
def create():
    authz.require(authz.logged_in())
    collection = Collection.create(request_data(), request.auth_role)
    db.session.commit()
    update_collection(collection)
    log_event(request)
    return view(collection.id)


@blueprint.route('/api/1/collections/<int:id>', methods=['GET'])
def view(id):
    collection = obj_or_404(Collection.by_id(id))
    authz.require(authz.collection_read(id))
    data = collection.to_dict()
    data.update(collection.content_statistics())
    return jsonify(data)


@blueprint.route('/api/1/collections/<int:id>', methods=['POST', 'PUT'])
def update(id):
    authz.require(authz.collection_write(id))
    collection = obj_or_404(Collection.by_id(id))
    collection.update(request_data())
    db.session.add(collection)
    db.session.commit()
    update_collection(collection)
    log_event(request)
    return view(id)


@blueprint.route('/api/1/collections/<int:id>/process', methods=['POST', 'PUT'])
def process(id):
    authz.require(authz.collection_write(id))
    collection = obj_or_404(Collection.by_id(id))
    analyze_collection.delay(collection.id)
    log_event(request)
    return jsonify({'status': 'ok'})


@blueprint.route('/api/1/collections/<int:id>/pending', methods=['GET'])
def pending(id):
    collection = obj_or_404(Collection.by_id(id))
    authz.require(authz.collection_read(id))
    q = collection.pending_entities()
    q = q.limit(30)
    entities = []
    for entity in q.all():
        data = entity.to_dict()
        data['name_latin'] = latinize_text(entity.name, lowercase=False)
        entities.append(data)
    return jsonify({'results': entities, 'total': len(entities)})


@blueprint.route('/api/1/collections/<int:id>/paths', methods=['GET'])
def paths(id):
    collection = obj_or_404(Collection.by_id(id))
    authz.require(authz.collection_read(collection.id))
    start_entity_id = request.args.get('entity_id')
    labels = request.args.getlist('label')
    types = request.args.getlist('type')
    collection_id = request.args.getlist('collection_id')
    end_collection_id = authz.collections_intersect(authz.READ, collection_id)
    q = Path.find(collection, start_entity_id=start_entity_id, labels=labels,
                  types=types, end_collection_id=end_collection_id)
    data = Pager(q, id=collection.id).to_dict()
    data['facets'] = Path.facets(collection, start_entity_id=start_entity_id,
                                 labels=labels, types=types,
                                 end_collection_id=end_collection_id,
                                 collection_id=authz.collections(authz.READ))
    return jsonify(data)


@blueprint.route('/api/1/collections/<int:id>', methods=['DELETE'])
def delete(id):
    collection = obj_or_404(Collection.by_id(id))
    authz.require(authz.collection_write(id))
    delete_collection.apply_async([collection.id], queue=USER_QUEUE,
                                  routing_key=USER_ROUTING_KEY)
    log_event(request)
    return jsonify({'status': 'ok'})
