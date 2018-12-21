from flask import Blueprint, request, stream_with_context

from aleph.model import Match, Audit
from aleph.logic.audit import record_audit
from aleph.views.util import get_db_collection, jsonify, stream_csv
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.serializers import MatchSchema, MatchCollectionsSchema
from aleph.serializers.xref import XrefSchema
from aleph.logic.xref import xref_collection, export_matches_csv
from aleph.views.util import parse_request


blueprint = Blueprint('xref_api', __name__)


@blueprint.route('/api/2/collections/<int:id>/xref', methods=['GET'])
def index(id):
    collection = get_db_collection(id)
    record_audit(Audit.ACT_COLLECTION, id=collection.id)
    parser = QueryParser(request.args, request.authz)
    q = Match.group_by_collection(collection.id, authz=request.authz)
    result = DatabaseQueryResult(request, q,
                                 parser=parser,
                                 schema=MatchCollectionsSchema)
    return jsonify(result)


@blueprint.route('/api/2/collections/<int:id>/xref/<int:other_id>',
                 methods=['GET'])
def matches(id, other_id):
    collection = get_db_collection(id)
    record_audit(Audit.ACT_COLLECTION, id=collection.id)
    other = get_db_collection(other_id)
    record_audit(Audit.ACT_COLLECTION, id=other.id)
    parser = QueryParser(request.args, request.authz)
    q = Match.find_by_collection(collection.id, other.id)
    result = DatabaseQueryResult(request, q,
                                 parser=parser,
                                 schema=MatchSchema)
    return jsonify(result)


@blueprint.route('/api/2/collections/<int:id>/xref', methods=['POST'])
def generate(id):
    data = parse_request(XrefSchema)
    collection = get_db_collection(id, request.authz.WRITE)
    against_ids = data.get("against_collection_ids")
    xref_collection.apply_async([collection.id], kwargs={"against_collection_ids": against_ids}, priority=5)
    return jsonify({'status': 'accepted'}, status=202)


@blueprint.route('/api/2/collections/<int:id>/xref.csv')
def csv_export(id):
    collection = get_db_collection(id, request.authz.READ)
    record_audit(Audit.ACT_COLLECTION, id=id)
    matches = export_matches_csv(collection.id, request.authz)
    return stream_csv(stream_with_context(matches))
