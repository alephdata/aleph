from banal import as_bool
from flask import Blueprint, request, send_file

from aleph.core import USER_QUEUE, USER_ROUTING_KEY
from aleph.model import Collection, Match
from aleph.views.util import get_collection, require, obj_or_404, jsonify
from aleph.search import QueryParser, DatabaseQueryResult, MatchQueryResult
from aleph.serializers import MatchSchema, MatchCollectionsSchema
from aleph.logic.xref import generate_excel, process_xref


blueprint = Blueprint('xref_api', __name__)


@blueprint.route('/api/2/collections/<int:id>/xref', methods=['GET'])
def summary(id):
    collection = obj_or_404(Collection.by_id(id))
    require(request.authz.can_read(collection.id))
    parser = QueryParser(request.args, request.authz, limit=10)
    q = Match.group_by_collection(collection.id, authz=request.authz)
    result = DatabaseQueryResult(request, q,
                                 parser=parser,
                                 schema=MatchCollectionsSchema)
    return jsonify(result)


@blueprint.route('/api/2/collections/<int:id>/xref/<int:other_id>',
                 methods=['GET'])
def matches(id, other_id):
    collection = obj_or_404(Collection.by_id(id))
    require(request.authz.can_read(collection.id))
    require(request.authz.can_read(other_id))
    parser = QueryParser(request.args, request.authz, limit=10)
    q = Match.find_by_collection(collection.id, other_id)
    result = MatchQueryResult(request, q,
                              parser=parser,
                              schema=MatchSchema)
    return jsonify(result)


@blueprint.route('/api/2/collections/<int:collection_id>/xref.xlsx')
def report(collection_id):
    collection = obj_or_404(Collection.by_id(collection_id))
    require(request.authz.can_read(collection.id))
    output = generate_excel(collection,
                            request.authz,
                            links=as_bool(request.args.get('links')),
                            one_sheet=as_bool(request.args.get('merge')))
    outputfile = "%s Cross-referenced.xlsx" % collection.label
    return send_file(output,
                     as_attachment=True,
                     attachment_filename=outputfile)


@blueprint.route('/api/2/collections/<int:collection_id>/xref',
                 methods=['POST'])
def generate_summary(collection_id):
    collection = get_collection(collection_id, request.authz.WRITE)
    process_xref.apply_async([collection.id],
                             queue=USER_QUEUE,
                             routing_key=USER_ROUTING_KEY)
    return jsonify({'status': 'accepted'}, status=202)


@blueprint.route('/api/2/collections/<int:collection_id>/xref/<int:other_id>',
                 methods=['POST'])
def generate_matches(collection_id, other_id):
    collection = get_collection(collection_id, request.authz.WRITE)
    other = get_collection(other_id, request.authz.WRITE)
    process_xref.apply_async([collection.id, other.id],
                             queue=USER_QUEUE,
                             routing_key=USER_ROUTING_KEY)
    return jsonify({'status': 'accepted'}, status=202)
