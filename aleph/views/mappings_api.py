import logging

from flask import Blueprint, request

from aleph.core import db
from aleph.model import Mapping
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.views.serializers import MappingSerializer
from aleph.views.util import get_db_collection, get_index_entity, parse_request  # noqa
from aleph.views.context import enable_cache
from aleph.views.forms import MappingSchema
from aleph.views.util import require, obj_or_404, get_session_id
from aleph.queues import queue_task, OP_BULKLOAD
from aleph.logic.collections import refresh_collection
from aleph.logic.mapping import load_query, get_mapping_query
from aleph.index.entities import delete_entities_by_mapping_id

blueprint = Blueprint('mappings_api', __name__)
log = logging.getLogger(__name__)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings', methods=['GET'])  # noqa
def index_by_collection(collection_id):
    collection = get_db_collection(collection_id)
    parser = QueryParser(request.args, request.authz)
    q = Mapping.by_collection(collection.id)
    if 'table' in parser.filters:
        q = Mapping.by_table(parser.filters['table'], q)
    result = DatabaseQueryResult(request, q, parser=parser)
    return MappingSerializer.jsonify_result(result)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings', methods=['POST', 'PUT'])  # noqa
def create(collection_id):
    collection = get_db_collection(collection_id, action=request.authz.WRITE)
    data = parse_request(MappingSchema)
    entity_id = data.get('table_id')
    query = load_query()
    enable_cache()
    entity = get_index_entity(entity_id, request.authz.READ)
    mapping = Mapping.create(query, entity.get('id'), collection, request.authz.id)  # noqa
    return MappingSerializer.jsonify(mapping)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>', methods=['GET'])  # noqa
def view(collection_id, mapping_id):
    require(request.authz.logged_in)
    get_db_collection(collection_id, action=request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    return MappingSerializer.jsonify(mapping)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>', methods=['DELETE'])  # noqa
def delete(collection_id, mapping_id):
    require(request.authz.session_write)
    get_db_collection(collection_id, action=request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    mapping.delete()
    db.session.commit()
    return ('', 204)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>/trigger',  # noqa
                 methods=['POST', 'PUT'])
def trigger(collection_id, mapping_id):
    require(request.authz.logged_in)
    collection = get_db_collection(collection_id, action=request.authz.WRITE)
    require(request.authz.can_bulk_import())
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    query = get_mapping_query(mapping)
    queue_task(collection, OP_BULKLOAD, job_id=get_session_id(), payload=query)
    collection.touch()
    db.session.commit()
    refresh_collection(collection.id)
    return ('', 202)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>/clear',  # noqa
                 methods=['POST', 'PUT'])
def clear(collection_id, mapping_id):
    """Delete the entities created by this mapping"""
    require(request.authz.logged_in)
    collection = get_db_collection(collection_id, request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    delete_entities_by_mapping_id(mapping.id)
    collection.touch()
    db.session.commit()
    refresh_collection(collection.id)
    return ('', 202)
