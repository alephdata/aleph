from flask import Blueprint, request
from apikit import jsonify, request_data

from aleph.core import USER_QUEUE, USER_ROUTING_KEY, db
from aleph.model import Collection
from aleph.search import CollectionsQuery
from aleph.events import log_event
from aleph.index.collections import get_collection_stats
from aleph.logic.collections import delete_collection, update_collection
from aleph.logic.collections import process_collection
from aleph.views.util import get_collection, require

blueprint = Blueprint('collections_api', __name__)


@blueprint.route('/api/2/collections', methods=['GET'])
def index():
    result = CollectionsQuery.handle_request(request)
    return jsonify(result)


@blueprint.route('/api/2/collections', methods=['POST', 'PUT'])
def create():
    require(request.authz.logged_in)
    data = request_data()
    data['managed'] = False
    collection = Collection.create(data, request.authz.role)
    db.session.commit()
    update_collection(collection)
    log_event(request)
    return jsonify(collection)


@blueprint.route('/api/2/collections/<int:id>', methods=['GET'])
def view(id):
    collection = get_collection(id)
    data = collection.to_dict()
    data = get_collection_stats(data)
    return jsonify(data)


@blueprint.route('/api/2/collections/<int:id>', methods=['POST', 'PUT'])
def update(id):
    collection = get_collection(id, request.authz.WRITE)
    collection.update(request_data())
    db.session.commit()
    update_collection(collection)
    log_event(request)
    return view(id)


@blueprint.route('/api/2/collections/<int:id>/process', methods=['POST', 'PUT'])  # noqa
def process(id):
    collection = get_collection(id, request.authz.WRITE)
    process_collection.apply_async([collection.id],
                                   queue=USER_QUEUE,
                                   routing_key=USER_ROUTING_KEY)
    log_event(request)
    return jsonify({'status': 'ok'})


@blueprint.route('/api/2/collections/<int:id>', methods=['DELETE'])
def delete(id):
    collection = get_collection(id, request.authz.WRITE)
    delete_collection.apply_async([collection.id],
                                  queue=USER_QUEUE,
                                  routing_key=USER_ROUTING_KEY)
    log_event(request)
    return jsonify({'status': 'ok'})
