import logging

from flask import Blueprint, request
# from followthemoney import model
# from followthemoney.exc import InvalidMapping
from werkzeug.exceptions import BadRequest

from aleph.core import db, archive
from aleph.model import Mapping
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.views.serializers import MappingSerializer, first
from aleph.views.util import get_db_collection, get_index_entity, parse_request  # noqa
from aleph.views.context import enable_cache
from aleph.views.forms import MappingSchema
from aleph.views.util import require, obj_or_404, get_session_id
from aleph.queues import queue_task, OP_BULKLOAD
from aleph.logic.collections import refresh_collection

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


def _load_query():
    try:
        query = request.json.get('mapping_query', '{}')
        # TODO: validate query
    except Exception as ex:
        raise BadRequest(str(ex))
    return query


@blueprint.route('/api/2/mappings', methods=['GET'])
def index():
    require(request.authz.logged_in)
    parser = QueryParser(request.args, request.authz)
    q = obj_or_404(Mapping.by_role_id(request.authz.id))
    result = DatabaseQueryResult(request, q, parser=parser)
    return MappingSerializer.jsonify_result(result)


@blueprint.route('/api/2/mappings', methods=['POST', 'PUT'])
def create():
    data = parse_request(MappingSchema)
    entity_id = data.get('table_id')
    query = _load_query()
    # TODO: validate query
    enable_cache()
    entity = get_index_entity(entity_id, request.authz.READ)
    collection = get_db_collection(
        entity['collection_id'], action=request.authz.WRITE
    )
    mapping = Mapping.create(query, entity.get('id'), collection, request.authz.id)  # noqa
    return MappingSerializer.jsonify(mapping)


@blueprint.route('/api/2/mappings/<int:mapping_id>', methods=['GET'])
def view(mapping_id):
    require(request.authz.logged_in)
    mapping = obj_or_404(Mapping.by_id(mapping_id, role_id=request.authz.id))
    return MappingSerializer.jsonify(mapping)


@blueprint.route('/api/2/mappings/<int:mapping_id>', methods=['DELETE'])
def delete(mapping_id):
    require(request.authz.session_write)
    mapping = obj_or_404(Mapping.by_id(mapping_id, role_id=request.authz.id))
    mapping.delete()
    db.session.commit()
    return ('', 204)


def _get_mapping_query(mapping):
    table = get_index_entity(mapping.table_id, request.authz.READ)
    properties = table.get('properties', {})
    csv_hash = first(properties.get('csvHash'))
    query = {
        'entities': mapping.entities_query
    }
    url = None
    if csv_hash:
        url = archive.generate_url(csv_hash)
        if not url:
            local_path = archive.load_file(csv_hash)
            if local_path is not None:
                url = local_path.as_posix()
        if url is not None:
            query['csv_url'] = url
            return {'query': query}
        raise BadRequest("Could not generate csv url for the table")
    raise BadRequest("Source table doesn't have a csvHash")


@blueprint.route('/api/2/mappings/<int:mapping_id>/trigger', methods=['POST', 'PUT'])  # noqa
def mapping(mapping_id):
    require(request.authz.logged_in)
    mapping = obj_or_404(Mapping.by_id(mapping_id, role_id=request.authz.id))
    collection = get_db_collection(mapping.collection_id, request.authz.WRITE)
    require(request.authz.can_bulk_import())
    query = _get_mapping_query(mapping)
    # try:
    #     model.make_mapping(query)
    # except InvalidMapping as invalid:
    #     raise BadRequest(invalid)
    queue_task(collection, OP_BULKLOAD, job_id=get_session_id(), payload=query)
    collection.touch()
    db.session.commit()
    refresh_collection(collection.id)
    return ('', 202)
