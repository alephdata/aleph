from flask import Blueprint, request, send_file
from apikit import arg_bool

from aleph.core import USER_QUEUE, USER_ROUTING_KEY
from aleph.model import Collection, Match
from aleph.views.util import get_collection, require, obj_or_404, jsonify
from aleph.search import QueryParser, DatabaseQueryResult, MatchQueryResult
from aleph.views.serializers import MatchSchema, MatchCollectionsSchema
from aleph.logic.xref import generate_excel, process_xref
from aleph.text import string_value


blueprint = Blueprint('xref_api', __name__)


@blueprint.route('/api/2/collections/<int:id>/xref')
def summary(id):
    collection = obj_or_404(Collection.by_id(id))
    require(request.authz.can_read(collection.id))
    parser = QueryParser(request.args, request.authz, limit=10)
    q = Match.group_by_collection(collection.id, authz=request.authz)
    result = DatabaseQueryResult(request, q,
                                 parser=parser,
                                 schema=MatchCollectionsSchema)
    return jsonify(result)


@blueprint.route('/api/2/collections/<int:id>/xref/<int:other_id>')
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
                            links=arg_bool('links'))
    outputfile = "%s_xref.xlsx" % string_value(collection.label)
    return send_file(output,
                     as_attachment=True,
                     attachment_filename=outputfile)


@blueprint.route('/api/2/collections/<int:collection_id>/xref', methods=['POST']):
def generate_matches(collection_id):
    collection = get_collection(collection_id, request.authz.WRITE)
    process_xref(collection).apply_async([collection.id],
                                   queue=USER_QUEUE,
                                   routing_key=USER_ROUTING_KEY)
    return jsonify({'status': 'accepted'}, status=202)