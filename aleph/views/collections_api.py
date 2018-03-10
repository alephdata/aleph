from flask import Blueprint, request

from aleph.core import db
from aleph.model import Collection
from aleph.search import CollectionsQuery
from aleph.logic.collections import delete_collection, update_collection
from aleph.logic.collections import process_collection
from aleph.serializers import CollectionSchema
from aleph.views.util import get_db_collection, get_index_collection
from aleph.views.util import require, jsonify, parse_request

blueprint = Blueprint('collections_api', __name__)


@blueprint.route('/api/2/collections', methods=['GET'])
def index():
    result = CollectionsQuery.handle(request, schema=CollectionSchema)
    return jsonify(result)


@blueprint.route('/api/2/collections', methods=['POST', 'PUT'])
def create():
    require(request.authz.logged_in)
    data = parse_request(CollectionSchema)
    collection = Collection.create(data, request.authz.role)
    db.session.commit()
    update_collection(collection)
    return view(collection.id)


@blueprint.route('/api/2/collections/<int:id>', methods=['GET'])
def view(id):
    collection = get_index_collection(id)
    return jsonify(collection, schema=CollectionSchema)


@blueprint.route('/api/2/collections/<int:id>', methods=['POST', 'PUT'])
def update(id):
    collection = get_db_collection(id, request.authz.WRITE)
    data = parse_request(CollectionSchema)
    collection.update(data)
    db.session.commit()
    update_collection(collection)
    return view(id)


@blueprint.route('/api/2/collections/<int:id>/process', methods=['POST', 'PUT'])  # noqa
def process(id):
    collection = get_db_collection(id, request.authz.WRITE)
    process_collection.apply_async([collection.id], priority=2)
    return jsonify({'status': 'accepted'}, status=202)


@blueprint.route('/api/2/collections/<int:id>', methods=['DELETE'])
def delete(id):
    collection = get_db_collection(id, request.authz.WRITE)
    delete_collection.apply_async([collection.id], priority=7)
    return jsonify({'status': 'accepted'}, status=202)
