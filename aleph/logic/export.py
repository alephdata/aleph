import os
import logging
from tempfile import mkdtemp
import shutil
import types

import zipstream
import requests
from followthemoney import model
from followthemoney.export.excel import ExcelExporter
from servicelayer.archive.util import ensure_path

from aleph.core import archive, db
from aleph.logic import resolver
from aleph.model import Collection, Export
from aleph.logic.util import entity_url
from aleph.queues import OP_EXPORT_SEARCH_RESULTS

log = logging.getLogger(__name__)
EXTRA_HEADERS = ["url", "collection"]


def write_document(zip_archive, collection, entity):
    if not entity.has("contentHash", quiet=True):
        return
    name = entity.first("fileName") or entity.caption
    name = "{0}-{1}".format(entity.id, name)
    path = os.path.join(collection.get("label"), name)
    content_hash = entity.first("contentHash")
    url = archive.generate_url(content_hash)
    if url is not None:
        stream = requests.get(url, stream=True)
        zip_archive.write_iter(path, stream.iter_content())
    else:
        local_path = archive.load_file(content_hash)
        if local_path is not None:
            zip_archive.write(local_path, arcname=path)


def export_entities(role_id, result):
    try:
        entities = []
        stub = types.SimpleNamespace(result=result)
        for entity in result["results"]:
            resolver.queue(stub, Collection, entity.get("collection_id"))
            entities.append(model.get_proxy(entity))
        resolver.resolve(stub)
        export_dir = ensure_path(mkdtemp(prefix="aleph.export."))
        file_path = export_dir.joinpath("query-export.zip")

        zip_archive = zipstream.ZipFile()
        exporter = ExcelExporter(None, extra=EXTRA_HEADERS)
        for entity in entities:
            collection_id = entity.context.get("collection_id")
            collection = resolver.get(stub, Collection, collection_id)
            extra = [entity_url(entity.id), collection.get("label")]
            exporter.write(entity, extra=extra)
            write_document(zip_archive, collection, entity)
        content = exporter.get_bytesio()
        zip_archive.write_iter("Export.xlsx", content)

        with open(file_path, "wb") as zf:
            for data in zip_archive:
                zf.write(data)

        label = "Search results"
        publish_export(
            OP_EXPORT_SEARCH_RESULTS,
            file_path,
            role_id,
            label=label,
            mime_type="application/zip",
        )
    finally:
        shutil.rmtree(export_dir)


def op_export_search_results_handler(collection, task):
    export_entities(**task.payload)


def publish_export(
    operation,
    file_path,
    role_id,
    expires_after=Export.DEFAULT_EXPIRATION,
    label=None,
    collection=None,
    mime_type=None,
):
    export = Export.create(
        operation, file_path, role_id, expires_after, label, collection, mime_type
    )
    export.publish()
    db.session.commit()


def delete_published_export(export):
    archive.delete_publication(export.namespace, export.file_name)


def delete_expired_exports():
    expired_exports = Export.get_expired(deleted=False)
    for export in expired_exports:
        delete_published_export(export)
