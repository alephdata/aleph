from banal import ensure_list
from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from followthemoney import model
from followthemoney.exc import InvalidMapping

from aleph.core import db
from aleph.model import Role, Audit
from aleph.search import CollectionsQuery
from aleph.logic.collections import create_collection, generate_sitemap
from aleph.logic.collections import delete_collection, update_collection
from aleph.logic.collections import delete_entities, delete_documents
from aleph.logic.documents import process_documents
from aleph.logic.entities import bulk_load_query, bulk_write
from aleph.logic.audit import record_audit
from aleph.index.util import refresh_index
from aleph.index.core import collections_index
from aleph.serializers import CollectionSchema
from aleph.views.util import get_db_collection, get_index_collection
from aleph.views.util import require, jsonify, parse_request, serialize_data
from aleph.views.util import render_xml
from aleph.util import dict_list

blueprint = Blueprint('collections_api', __name__)


@blueprint.route('/api/2/collections', methods=['GET'])
def index():
    result = CollectionsQuery.handle(request, schema=CollectionSchema)
    return jsonify(result)


@blueprint.route('/api/2/collections', methods=['POST', 'PUT'])
def create():
    require(request.authz.logged_in)
    data = parse_request(CollectionSchema)
    role = Role.by_id(request.authz.id)
    collection = create_collection(data, role=role)
    refresh_index(collections_index())
    return view(collection.id)


@blueprint.route('/api/2/collections/<int:id>', methods=['GET'])
def view(id):
    collection = get_index_collection(id)
    record_audit(Audit.ACT_COLLECTION, id=id)
    return serialize_data(collection, CollectionSchema)


@blueprint.route('/api/2/collections/<int:id>/sitemap.xml', methods=['GET'])
def sitemap(id):
    get_db_collection(id, request.authz.READ)
    return render_xml('sitemap.xml', entries=generate_sitemap(id))


@blueprint.route('/api/2/collections/<int:id>', methods=['POST', 'PUT'])
def update(id):
    collection = get_db_collection(id, request.authz.WRITE)
    data = parse_request(CollectionSchema)
    collection.update(data)
    db.session.commit()
    update_collection(collection)
    return serialize_data(collection, CollectionSchema)


@blueprint.route('/api/2/collections/<int:id>/process', methods=['POST', 'PUT'])  # noqa
def process(id):
    collection = get_db_collection(id, request.authz.WRITE)
    # re-process the documents
    process_documents.delay(collection_id=collection.id)
    update_collection(collection)
    return ('', 204)


@blueprint.route('/api/2/collections/<int:id>/mapping', methods=['POST', 'PUT'])  # noqa
def mapping_process(id):
    collection = get_db_collection(id, request.authz.WRITE)
    require(request.authz.is_admin)
    if not request.is_json:
        raise BadRequest()
    data = request.get_json().get(collection.foreign_id)
    for query in dict_list(data, 'queries', 'query'):
        try:
            model.make_mapping(query)
            bulk_load_query.apply_async([collection.id, query], priority=6)
        except InvalidMapping as invalid:
            raise BadRequest(invalid)
    return ('', 204)


@blueprint.route('/api/2/collections/<int:id>/_bulk', methods=['POST'])
def bulk(id):
    collection = get_db_collection(id, request.authz.WRITE)
    entities = ensure_list(request.get_json(force=True))
    bulk_write(collection, entities)
    return ('', 204)


@blueprint.route('/api/2/collections/<int:id>', methods=['DELETE'])
def delete(id):
    collection = get_db_collection(id, request.authz.WRITE)
    delete_collection(collection)
    refresh_index(collections_index())
    return ('', 204)


@blueprint.route('/api/2/collections/<int:id>/entities', methods=['DELETE'])
def delete_entities_api(id):
    collection = get_db_collection(id, request.authz.WRITE)
    delete_entities.delay(collection.id)
    return view(collection.id)


@blueprint.route('/api/2/collections/<int:id>/documents', methods=['DELETE'])
def delete_documents_api(id):
    collection = get_db_collection(id, request.authz.WRITE)
    delete_documents.delay(collection.id)
    return view(collection.id)
