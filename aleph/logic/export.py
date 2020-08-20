import os
import logging
from tempfile import mkdtemp
import shutil
import types
from pprint import pformat  # noqa

import zipstream
import requests
from followthemoney import model
from followthemoney.export.excel import ExcelExporter
from servicelayer.archive.util import ensure_path

from aleph.core import archive, db, cache
from aleph.model import Collection, Export, Events, Role
from aleph.logic.util import entity_url
from aleph.logic.notifications import publish

log = logging.getLogger(__name__)
EXTRA_HEADERS = ["url", "collection"]


def get_export(export_id):
    if export_id is None:
        return
    key = cache.object_key(Export, export_id)
    data = cache.get_complex(key)
    if data is None:
        export = Export.by_id(export_id)
        if export is None:
            return
        log.debug("Export cache refresh: %r", export)
        data = export.to_dict()
        cache.set_complex(key, data, expires=cache.EXPIRE)
    return data


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


def export_entities(export_id, result):
    from aleph.logic import resolver

    entities = []
    stub = types.SimpleNamespace(result=result)
    for entity in result["results"]:
        resolver.queue(stub, Collection, entity.get("collection_id"))
        entities.append(model.get_proxy(entity))
    resolver.resolve(stub)
    export_dir = ensure_path(mkdtemp(prefix="aleph.export."))
    file_path = export_dir.joinpath("query-export.zip")

    try:
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

        publish_export(export_id, file_path)
    finally:
        shutil.rmtree(export_dir)


def create_export(
    operation,
    role_id,
    label,
    file_path=None,
    expires_after=Export.DEFAULT_EXPIRATION,
    collection=None,
    mime_type=None,
):
    export = Export.create(
        operation, role_id, label, file_path, expires_after, collection, mime_type
    )
    db.session.commit()
    return export


def publish_export(export_id, file_path=None):
    export = Export.by_id(export_id)
    if file_path:
        export.set_filepath(file_path)
    export.publish()
    db.session.commit()
    params = {"export": export}
    role = Role.by_id(export.creator_id)
    publish(
        Events.PUBLISH_EXPORT, params=params, channels=[role],
    )


def delete_expired_exports():
    expired_exports = Export.get_expired(deleted=False)
    for export in expired_exports:
        export.delete_publication()
    db.session.commit()
