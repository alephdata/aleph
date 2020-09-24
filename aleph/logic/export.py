import os
import shutil
import logging
import zipstream
from pprint import pformat  # noqa
from pathlib import Path
from tempfile import mkdtemp
from flask import render_template
from normality import safe_filename
from followthemoney.helpers import entity_filename
from followthemoney.export.excel import ExcelExporter
from servicelayer.archive.util import checksum, ensure_path

from aleph.core import archive, db, url_for, settings
from aleph.authz import Authz
from aleph.model import Export, Events, Role, Status
from aleph.index.entities import iter_proxies
from aleph.index.collections import get_collection
from aleph.logic.util import entity_url, ui_url
from aleph.logic.notifications import publish
from aleph.logic.mail import email_role


log = logging.getLogger(__name__)
EXTRA_HEADERS = ["url", "collection"]


def get_export(export_id):
    if export_id is None:
        return
    export = Export.by_id(export_id)
    if export is not None:
        return export.to_dict()
        log.debug("Export cache refresh: %r", export)


def write_document(export_dir, zf, collection, entity, fp):
    content_hash = entity.first("contentHash", quiet=True)
    if content_hash is None:
        return
    file_name = entity_filename(entity)
    arcname = "{0}-{1}".format(entity.id, file_name)
    arcname = os.path.join(collection.get("label"), arcname)
    log.info("Export file: %s", arcname)
    try:
        local_path = archive.load_file(content_hash, temp_path=export_dir)
        if local_path is not None and os.path.exists(local_path):
            zf.write(local_path, arcname=arcname)
            for data in zf.flush():
                fp.write(data)
    finally:
        archive.cleanup_file(content_hash, temp_path=export_dir)


def export_entities(export_id):
    export = Export.by_id(export_id)
    log.info("Export entities [%r]...", export)
    export_dir = ensure_path(mkdtemp(prefix="aleph.export."))
    collections = {}
    try:
        filters = [export.meta.get("query", {"match_none": {}})]
        file_path = export_dir.joinpath("query-export.zip")
        with open(file_path, "wb") as fp:
            zf = zipstream.ZipFile(mode="w")
            exporter = ExcelExporter(None, extra=EXTRA_HEADERS)
            for entity in iter_proxies(filters=filters):
                collection_id = entity.context.get("collection_id")
                if collection_id not in collections:
                    collections[collection_id] = get_collection(collection_id)
                collection = collections[collection_id]
                if collection is None:
                    continue
                extra = [entity_url(entity.id), collection.get("label")]
                exporter.write(entity, extra=extra)
                write_document(export_dir, zf, collection, entity, fp)

            content = exporter.get_bytesio()
            zf.write_iter("Export.xlsx", content)
            for data in zf:
                fp.write(data)
        complete_export(export_id, file_path)
    except Exception:
        log.exception("Failed to process export [%s]", export_id)
        export = Export.by_id(export_id)
        export.set_status(status=Status.FAILED)
        db.session.commit()
    finally:
        shutil.rmtree(export_dir)


def create_export(
    operation,
    role_id,
    label,
    collection=None,
    mime_type=None,
    meta=None,
):
    export = Export.create(
        operation,
        role_id,
        label,
        collection=collection,
        mime_type=mime_type,
        meta=meta,
    )
    db.session.commit()
    return export


def complete_export(export_id, file_path):
    export = Export.by_id(export_id)
    file_path = ensure_path(file_path)
    export.file_name = safe_filename(file_path)
    export.file_size = file_path.stat().st_size
    export.content_hash = checksum(file_path)
    path = Path(file_path.parent, export.content_hash)
    file_path.rename(path)
    try:
        archive.publish(export.namespace, path, export.mime_type)
        export.set_status(status=Status.SUCCESS)
    except Exception:
        log.exception("Failed to upload export: %s", export)
        export.set_status(status=Status.FAILED)

    db.session.commit()
    params = {"export": export}
    role = Role.by_id(export.creator_id)
    publish(
        Events.COMPLETE_EXPORT,
        params=params,
        channels=[role],
    )
    send_export_notification(export)


def delete_expired_exports():
    expired_exports = Export.get_expired(deleted=False)
    for export in expired_exports:
        log.info("Deleting expired export: %r", export)
        if export.should_delete_publication():
            archive.delete_publication(export.namespace, export.content_hash)
        export.deleted = True
        db.session.add(export)
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
