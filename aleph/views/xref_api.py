from flask import Blueprint, request

from aleph.model import Match
from aleph.views.util import get_db_collection, jsonify
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.serializers import MatchSchema, MatchCollectionsSchema
from aleph.logic.xref import xref_collection


blueprint = Blueprint('xref_api', __name__)


@blueprint.route('/api/2/collections/<int:id>/xref', methods=['GET'])
def index(id):
    collection = get_db_collection(id)
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
    other = get_db_collection(other_id)
    parser = QueryParser(request.args, request.authz)
    q = Match.find_by_collection(collection.id, other.id)
    result = DatabaseQueryResult(request, q,
                                 parser=parser,
                                 schema=MatchSchema)
    return jsonify(result)


@blueprint.route('/api/2/collections/<int:collection_id>/xref',
                 methods=['POST'])
def generate_summary(collection_id):
    collection = get_db_collection(collection_id, request.authz.WRITE)
    xref_collection.apply_async([collection.id], priority=5)
    return jsonify({'status': 'accepted'}, status=202)


@blueprint.route('/api/2/collections/<int:collection_id>/xref/<int:other_id>',
                 methods=['POST'])
def generate_matches(collection_id, other_id):
    collection = get_db_collection(collection_id, request.authz.WRITE)
    other = get_db_collection(other_id)
    xref_collection.apply_async([collection.id, other.id], priority=6)
    return jsonify({'status': 'accepted'}, status=202)
