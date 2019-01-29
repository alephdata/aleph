import logging
from banal import ensure_list
from flask.wrappers import Response
from flask import Blueprint, request

from aleph.model import Audit
from aleph.logic.audit import record_audit
from aleph.index.entities import iter_entities
from aleph.index.records import iter_records
from aleph.logic.graph.rdf import export_collection
from aleph.views.util import get_db_document, get_db_collection
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
        record_audit(Audit.ACT_COLLECTION, id=collection_id)
    entities = iter_entities(authz=request.authz,
                             collection_id=collection_id,
                             schemata=schemata,
                             excludes=excludes,
                             includes=includes)
    return stream_ijson(entities)


@blueprint.route('/api/2/records/_stream')
@blueprint.route('/api/2/collections/<int:collection_id>/_records')
@blueprint.route('/api/2/documents/<int:document_id>/records/_stream')
def records(document_id=None, collection_id=None):
    require(request.authz.can_stream())
    log.debug("Stream records [%r] begins... (coll: %s)",
              request.authz, collection_id)
    if collection_id is not None:
        get_db_collection(collection_id, request.authz.READ)
        record_audit(Audit.ACT_COLLECTION, id=collection_id)
    elif document_id is not None:
        get_db_document(document_id)
        record_audit(Audit.ACT_ENTITY, id=document_id)
    else:
        # no authz on records, this means *full* export.
        require(request.authz.is_admin)
    records = iter_records(document_id=document_id,
                           collection_id=collection_id)
    return stream_ijson(records)


@blueprint.route('/api/2/collections/<int:collection_id>/_rdf')
def triples(collection_id):
    require(request.authz.can_stream())
    log.debug("Stream triples [%r] begins... (coll: %s)",
              request.authz, collection_id)
    collection = get_db_collection(collection_id, request.authz.READ)
    record_audit(Audit.ACT_COLLECTION, id=collection_id)
    return Response(export_collection(collection), mimetype='text/plain')
