import os
import logging
from tempfile import mkdtemp
import shutil
import types
from pprint import pformat  # noqa
import requests
import zipstream
from flask import render_template
from followthemoney import model
from followthemoney.export.excel import ExcelExporter
from servicelayer.archive.util import ensure_path

from aleph.core import archive, db, cache, url_for, settings
from aleph.authz import Authz
from aleph.model import Collection, Export, Events, Role
from aleph.logic.util import entity_url, ui_url
from aleph.logic.notifications import publish
from aleph.logic.mail import email_role


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
    try:
        local_path = archive.load_file(content_hash)
        if local_path is not None:
            zip_archive.write(local_path, arcname=path)
    finally:
        archive.cleanup_file(content_hash)


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

        complete_export(export_id, file_path)
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


def complete_export(export_id, file_path=None):
    export = Export.by_id(export_id)
    if file_path:
        export.set_filepath(file_path)
    export.publish()
    db.session.commit()
    params = {"export": export}
    role = Role.by_id(export.creator_id)
    publish(
        Events.COMPLETE_EXPORT, params=params, channels=[role],
    )
    send_export_notification(export)


def delete_expired_exports():
    expired_exports = Export.get_expired(deleted=False)
    for export in expired_exports:
        export.delete_publication()
    db.session.commit()


def send_export_notification(export):
    role = Role.by_id(export.creator_id)
    authz = Authz.from_role(role)
    download_url = url_for(
        "exports_api.download",
        export_id=export.id,
        _authz=authz,
        _expire=export.expires_at,
    )
    params = dict(
        role=role,
        export_label=export.label,
        download_url=download_url,
        expiration_date=export.expires_at.strftime("%Y-%m-%d"),
        exports_url=ui_url("exports"),
        ui_url=settings.APP_UI_URL,
        app_title=settings.APP_TITLE,
    )
    plain = render_template("email/export.txt", **params)
    html = render_template("email/export.html", **params)
    log.info("Notification: %s", plain)
    subject = "Export ready for download"
    email_role(role, subject, html=html, plain=plain)
