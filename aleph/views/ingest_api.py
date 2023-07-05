import json
import shutil
import logging
from banal import ensure_dict
from flask import Blueprint, request, abort
from tempfile import mkdtemp
from normality import safe_filename, stringify
from servicelayer.archive.util import ensure_path

from aleph.core import db, archive
from aleph.model import Document, Entity, Events
from aleph.queues import ingest_entity
from aleph.index.entities import index_proxy
from aleph.logic.documents import ingest_flush
from aleph.logic.notifications import publish, channel_tag
from aleph.views.util import get_db_collection, get_flag, validate, get_session_id

log = logging.getLogger(__name__)
blueprint = Blueprint("ingest_api", __name__)


def _load_parent(collection, meta):
    """Determine the parent document for the document that is to be
    ingested."""
    parent = ensure_dict(meta.get("parent"))
    parent_id = meta.get("parent_id", parent.get("id"))
    if parent_id is None:
        return
    parent = Document.by_id(parent_id, collection=collection)
    if parent is None:
        abort(400, description="Cannot load parent document")
    return parent


def _load_metadata():
    """Unpack the common, pre-defined metadata for all the uploaded files."""
    try:
        meta = json.loads(request.form.get("meta", "{}"))
    except Exception as ex:
        abort(400, description=str(ex))

    validate(meta, "DocumentIngest")
    foreign_id = stringify(meta.get("foreign_id"))
    if not len(request.files) and foreign_id is None:
        abort(400, description="Directories need to have a foreign_id")
    return meta, foreign_id


def _notify(collection, document_id):
    if not collection.casefile:
        return
    channels = [
        channel_tag(document_id, Entity),
        channel_tag(collection),
    ]
    params = {"collection": collection, "document": document_id}
    publish(
        Events.INGEST_DOCUMENT,
        params=params,
        channels=channels,
        actor_id=request.authz.id,
    )


@blueprint.route("/<int:collection_id>/ingest", methods=["POST", "PUT"])
def ingest_upload(collection_id):
    """
    ---
    post:
      summary: Upload a document to a collection
      description: Upload a document to a collection with id `collection_id`
      parameters:
      - in: path
        name: collection_id
        required: true
        schema:
          type: integer
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                  description: The document to upload
                meta:
                  $ref: '#/components/schemas/DocumentIngest'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                properties:
                  id:
                    description: id of the uploaded document
                    type: integer
                  status:
                    type: string
                type: object
      tags:
      - Ingest
      - Collection
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    job_id = get_session_id()
    sync = get_flag("sync", default=False)
    index = get_flag("index", default=True)
    meta, foreign_id = _load_metadata()
    parent = _load_parent(collection, meta)
    upload_dir = ensure_path(mkdtemp(prefix="aleph.upload."))
    try:
        content_hash = None
        for storage in request.files.values():
            path = safe_filename(storage.filename, default="upload")
            path = upload_dir.joinpath(path)
            storage.save(str(path))
            content_hash = archive.archive_file(path)
        document = Document.save(
            collection=collection,
            parent=parent,
            foreign_id=foreign_id,
            content_hash=content_hash,
            meta=meta,
            role_id=request.authz.id,
        )
        collection.touch()
        db.session.commit()
        proxy = document.to_proxy(ns=collection.ns)
        if proxy.schema.is_a(Document.SCHEMA_FOLDER) and sync and index:
            index_proxy(collection, proxy, sync=sync)
        ingest_flush(collection, entity_id=proxy.id)
        ingest_entity(collection, proxy, job_id=job_id, index=index)
        _notify(collection, proxy.id)
        return {"status": "ok", "id": proxy.id}, 201
    finally:
        shutil.rmtree(upload_dir)
