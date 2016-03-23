from flask import Blueprint, request
from apikit import obj_or_404, jsonify, Pager, request_data

from aleph import authz
from aleph.model import Collection, db
from aleph.analyze import analyze_terms
from aleph.views.cache import enable_cache

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
    return view(collection.id)


@blueprint.route('/api/1/collections/<int:id>', methods=['GET'])
def view(id):
    authz.require(authz.collection_read(id))
    collection = obj_or_404(Collection.by_id(id))
    return jsonify(collection)


@blueprint.route('/api/1/collections/<int:id>', methods=['POST', 'PUT'])
def update(id):
    authz.require(authz.collection_write(id))
    collection = obj_or_404(Collection.by_id(id))
    collection.update(request_data())
    db.session.add(collection)
    db.session.commit()
    return view(id)


@blueprint.route('/api/1/collections/<int:id>', methods=['DELETE'])
def delete(id):
    authz.require(authz.collection_write(id))
    collection = obj_or_404(Collection.by_id(id))
    analyze_terms.delay(collection.terms)
    collection.delete()
    db.session.commit()
    return jsonify({'status': 'ok'})
