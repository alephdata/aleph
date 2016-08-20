from flask import Blueprint, request
from apikit import obj_or_404, request_data, jsonify, Pager

from aleph import authz
from aleph.core import db
from aleph.model import Network, Collection
from aleph.events import log_event

blueprint = Blueprint('networks_api', __name__)


@blueprint.route('/api/1/collections/<int:collection_id>/networks',
                 methods=['GET'])
def index(collection_id):
    collection = obj_or_404(Collection.by_id(collection_id))
    authz.require(authz.collection_read(collection.id))
    q = Network.all()
    q = q.filter(Network.collection_id == collection.id)
    return jsonify(Pager(q, collection_id=collection.id))


@blueprint.route('/api/1/collections/<int:collection_id>/networks',
                 methods=['POST', 'PUT'])
def create(collection_id):
    collection = obj_or_404(Collection.by_id(collection_id))
    authz.require(authz.collection_write(collection.id))
    network = Network.create(request_data(), collection, request.auth_role)
    db.session.commit()
    log_event(request)
    return view(collection_id, network.id)


@blueprint.route('/api/1/collections/<int:collection_id>/networks/<int:id>',
                 methods=['GET'])
def view(collection_id, id):
    collection = obj_or_404(Collection.by_id(collection_id))
    authz.require(authz.collection_read(collection_id))
    network = obj_or_404(Network.by_id_collection(id, collection))
    return jsonify(network)


@blueprint.route('/api/1/collections/<int:collection_id>/networks/<int:id>',
                 methods=['POST', 'PUT'])
def update(collection_id, id):
    collection = obj_or_404(Collection.by_id(collection_id))
    authz.require(authz.collection_write(collection_id))
    network = obj_or_404(Network.by_id_collection(id, collection))
    network.update(request_data())
    log_event(request)
    db.session.commit()
    return view(collection_id, network.id)


@blueprint.route('/api/1/collections/<int:collection_id>/networks/<int:id>',
                 methods=['DELETE'])
def delete(collection_id, id):
    collection = obj_or_404(Collection.by_id(collection_id))
    authz.require(authz.collection_write(collection.id))
    network = obj_or_404(Network.by_id_collection(id, collection))
    network.delete()
    db.session.commit()
    log_event(request)
    return jsonify({'status': 'ok'})
