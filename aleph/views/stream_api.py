import logging
from banal import ensure_list
from flask.wrappers import Response
from flask import Blueprint, request

from aleph.index.entities import iter_entities
from aleph.logic.rdf import export_collection
from aleph.views.util import get_db_collection
from aleph.views.util import require, stream_ijson

log = logging.getLogger(__name__)
blueprint = Blueprint('bulk_api', __name__)


@blueprint.route('/api/2/entities/_stream')
@blueprint.route('/api/2/collections/<int:collection_id>/_stream')
def entities(collection_id=None):
    require(request.authz.can_stream())
    log.debug("Stream entities [%r] begins... (coll: %s)",
              request.authz, collection_id)
    schemata = ensure_list(request.args.getlist('schema'))
    excludes = ['text', 'roles', 'fingerprints']
    includes = ensure_list(request.args.getlist('include'))
    includes = [f for f in includes if f not in excludes]
    if collection_id is not None:
        get_db_collection(collection_id, request.authz.READ)
    entities = iter_entities(authz=request.authz,
                             collection_id=collection_id,
                             schemata=schemata,
                             excludes=excludes,
                             includes=includes)
    return stream_ijson(entities)


@blueprint.route('/api/2/collections/<int:collection_id>/_rdf')
def triples(collection_id):
    require(request.authz.can_stream())
    log.debug("Stream triples [%r] begins... (coll: %s)",
              request.authz, collection_id)
    collection = get_db_collection(collection_id, request.authz.READ)
    return Response(export_collection(collection), mimetype='text/plain')
