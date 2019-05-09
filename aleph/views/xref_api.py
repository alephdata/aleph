from flask import Blueprint, request, stream_with_context

from aleph.model import Match
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.logic.entities.xref import xref_collection, export_matches_csv
from aleph.views.serializers import MatchSerializer, MatchCollectionsSerializer
from aleph.views.forms import XrefSchema
from aleph.views.util import get_db_collection, jsonify, stream_csv
from aleph.views.util import parse_request


blueprint = Blueprint('xref_api', __name__)


@blueprint.route('/api/2/collections/<int:collection_id>/xref', methods=['GET'])  # noqa
def index(collection_id):
    collection = get_db_collection(collection_id)
    parser = QueryParser(request.args, request.authz)
    q = Match.group_by_collection(collection.id, authz=request.authz)
    result = DatabaseQueryResult(request, q, parser=parser)
    return MatchCollectionsSerializer.jsonify_result(result)


@blueprint.route('/api/2/collections/<int:collection_id>/xref/<int:other_id>',
                 methods=['GET'])
def matches(collection_id, other_id):
    collection = get_db_collection(collection_id)
    other = get_db_collection(other_id)
    parser = QueryParser(request.args, request.authz)
    q = Match.find_by_collection(collection.id, other.id)
    result = DatabaseQueryResult(request, q, parser=parser)
    return MatchSerializer.jsonify_result(result)


@blueprint.route('/api/2/collections/<int:collection_id>/xref', methods=['POST'])  # noqa
def generate(collection_id):
    data = parse_request(XrefSchema)
    collection = get_db_collection(collection_id, request.authz.WRITE)
    args = {
        "against_collection_ids": data.get("against_collection_ids")
    }
    xref_collection.apply_async([collection.id], kwargs=args, priority=5)
    return jsonify({'status': 'accepted'}, status=202)


@blueprint.route('/api/2/collections/<int:collection_id>/xref.csv')
def csv_export(collection_id):
    collection = get_db_collection(collection_id, request.authz.READ)
    matches = export_matches_csv(collection.id, request.authz)
    return stream_csv(stream_with_context(matches))
