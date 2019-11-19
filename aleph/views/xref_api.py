from banal import ensure_list
from flask import Blueprint, request, send_file

from aleph.model import Match
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.logic.xref import export_matches
from aleph.views.serializers import MatchSerializer, MatchCollectionsSerializer
from aleph.queues import queue_task, OP_XREF
from aleph.views.util import get_db_collection, jsonify
from aleph.views.util import parse_request

XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'  # noqa
blueprint = Blueprint('xref_api', __name__)


@blueprint.route('/api/2/collections/<int:collection_id>/xref', methods=['GET'])  # noqa
def index(collection_id):
    """
    ---
    """
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
    against = ensure_list(data.get("against_collection_ids"))
    payload = {'against_collection_ids': against}
    queue_task(collection, OP_XREF, payload=payload)
    return jsonify({'status': 'accepted'}, status=202)


@blueprint.route('/api/2/collections/<int:collection_id>/xref/export')
def export(collection_id):
    collection = get_db_collection(collection_id, request.authz.READ)
    buffer = export_matches(collection.id, request.authz)
    file_name = '%s - Crossreference.xlsx' % collection.label
    return send_file(buffer,
                     mimetype=XLSX_MIME,
                     as_attachment=True,
                     attachment_filename=file_name)
