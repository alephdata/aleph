import logging
from banal import first
from followthemoney import model
from flask import Blueprint, request
from werkzeug.exceptions import BadRequest

from aleph.model import Mapping
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.views.serializers import MappingSerializer
from aleph.views.util import get_db_collection, get_index_entity, parse_request  # noqa
from aleph.views.forms import MappingSchema
from aleph.views.util import require, obj_or_404
from aleph.logic.mapping import load_mapping, flush_mapping

blueprint = Blueprint('mappings_api', __name__)
log = logging.getLogger(__name__)


def load_query():
    try:
        query = request.json.get('mapping_query', '{}')
        # just for validation
        model.make_mapping({'entities': query})
    except Exception as ex:
        raise BadRequest(ex)
    return query


@blueprint.route('/api/2/collections/<int:collection_id>/mappings', methods=['GET'])  # noqa
def index(collection_id):
    collection = get_db_collection(collection_id)
    parser = QueryParser(request.args, request.authz)
    table_id = first(parser.filters.get('table'))
    q = Mapping.by_collection(collection.id, table_id=table_id)
    result = DatabaseQueryResult(request, q, parser=parser)
    return MappingSerializer.jsonify_result(result)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings', methods=['POST', 'PUT'])  # noqa
def create(collection_id):
    collection = get_db_collection(collection_id, request.authz.WRITE)
    data = parse_request(MappingSchema)
    entity_id = data.get('table_id')
    query = load_query()
    entity = get_index_entity(entity_id, request.authz.READ)
    mapping = Mapping.create(query, entity.get('id'), collection, request.authz.id)  # noqa
    return MappingSerializer.jsonify(mapping)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>', methods=['GET'])  # noqa
def view(collection_id, mapping_id):
    get_db_collection(collection_id, request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    return MappingSerializer.jsonify(mapping)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>', methods=['POST', 'PUT'])  # noqa
def update(collection_id, mapping_id):
    collection = get_db_collection(collection_id, request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    data = parse_request(MappingSchema)
    entity_id = data.get('table_id')
    query = load_query()
    entity = get_index_entity(entity_id, request.authz.READ)
    mapping.update(query=query, table_id=entity.get('id'))
    if request.args.get('flush') == 'true':
        flush_mapping(collection, mapping)
    if request.args.get('trigger') == 'true':
        load_mapping(collection, mapping)
    return MappingSerializer.jsonify(mapping)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>', methods=['DELETE'])  # noqa
def delete(collection_id, mapping_id):
    collection = get_db_collection(collection_id, request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    mapping.delete()
    if request.args.get('flush') == 'true':
        flush_mapping(collection, mapping)
    return ('', 204)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>/trigger',  # noqa
                 methods=['POST', 'PUT'])
def trigger(collection_id, mapping_id):
    collection = get_db_collection(collection_id, request.authz.WRITE)
    require(request.authz.can_bulk_import())
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    load_mapping(collection, mapping)
    return ('', 202)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>/flush',  # noqa
                 methods=['POST', 'PUT'])
def flush(collection_id, mapping_id):
    """Delete the entities created by this mapping"""
    collection = get_db_collection(collection_id, request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    flush_mapping(collection, mapping)
    return ('', 202)
