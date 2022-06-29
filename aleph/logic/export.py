# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

import os
import shutil
import logging
from pprint import pformat  # noqa
from zipfile import ZipFile
from tempfile import mkdtemp
from flask import render_template
from normality import safe_filename
from followthemoney.helpers import entity_filename
from followthemoney.export.excel import ExcelExporter
from servicelayer.archive.util import checksum, ensure_path

from aleph.core import archive, db, settings
from aleph.queues import queue_task
from aleph.model import Export, Events, Role, Status, Entity
from aleph.index.entities import iter_proxies, checksums_count
from aleph.index.collections import get_collection
from aleph.logic.util import entity_url, ui_url, archive_url
from aleph.logic.notifications import publish
from aleph.logic.mail import email_role


log = logging.getLogger(__name__)
EXTRA_HEADERS = ["url", "collection"]
WARNING = """
This data export was aborted before it was complete, because the %s
exported entities exceeds the limits set by the system operators.

Contact the operator to discuss bulk exports.
"""


def get_export(export_id):
    if export_id is None:
        return
    export = Export.by_id(export_id, deleted=True)
    if export is not None:
        return export.to_dict()


def write_document(export_dir, zf, collection, entity):
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
    finally:
        archive.cleanup_file(content_hash, temp_path=export_dir)


def export_entities(export_id):
    export = Export.by_id(export_id)
    log.info("Export entities [%r]...", export)
    export_dir = ensure_path(mkdtemp(prefix="aleph.export."))
    collections = {}
    try:
        filters = [export.meta.get("query", {"match_none": {}})]
        file_path = export_dir.joinpath("export.zip")
        with ZipFile(file_path, mode="w") as zf:
            excel_name = safe_filename(export.label, extension="xlsx")
            excel_path = export_dir.joinpath(excel_name)
            exporter = ExcelExporter(excel_path, extra=EXTRA_HEADERS)
            schemata = export.meta.get("schemata", [Entity.THING])
            proxies = iter_proxies(schemata=schemata, filters=filters)
            for idx, entity in enumerate(proxies):
                collection_id = entity.context.get("collection_id")
                if collection_id not in collections:
                    collections[collection_id] = get_collection(collection_id)
                collection = collections[collection_id]
                if collection is None:
                    continue
                extra = [entity_url(entity.id), collection.get("label")]
                exporter.write(entity, extra=extra)
                write_document(export_dir, zf, collection, entity)
                if file_path.stat().st_size >= settings.EXPORT_MAX_SIZE:
                    concern = "total size of the"
                    zf.writestr("EXPORT_TOO_LARGE.txt", WARNING % concern)
                    break
                if idx >= settings.EXPORT_MAX_RESULTS:
                    concern = "number of"
                    zf.writestr("EXPORT_TOO_LARGE.txt", WARNING % concern)
                    break

            exporter.finalize()
            zf.write(excel_path, arcname=excel_name)
        file_name = "Export: %s" % export.label
        file_name = safe_filename(file_name, extension="zip")
        complete_export(export_id, file_path, file_name)
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


def complete_export(export_id, file_path, file_name):
    export = Export.by_id(export_id)
    file_path = ensure_path(file_path)
    export.file_name = file_name
    export.file_size = file_path.stat().st_size
    export.content_hash = checksum(file_path)
    try:
        archive.archive_file(
            file_path, content_hash=export.content_hash, mime_type=export.mime_type
        )
        export.set_status(status=Status.SUCCESS)
    except Exception:
        log.exception("Failed to upload export: %s", export)
        export.set_status(status=Status.FAILED)

    db.session.commit()
    params = {"export": export}
    role = Role.by_id(export.creator_id)
    log.info("Export [%r] complete: %s", export, export.status)
    publish(
        Events.COMPLETE_EXPORT,
        params=params,
        channels=[role],
    )
    send_export_notification(export)


def delete_expired_exports():
    """Delete export files from the archive after their time
    limit has expired."""
    expired_exports = Export.get_expired(deleted=False)
    for export in expired_exports:
        log.info("Deleting expired export: %r", export)
        if export.should_delete_publication():
            if export.content_hash is not None:
                counts = list(checksums_count([export.content_hash]))
                if counts[0][1] == 0:
                    archive.delete_file(export.content_hash)
        export.deleted = True
        db.session.add(export)
    db.session.commit()


def retry_exports():
    for export in Export.get_pending():
        queue_task(None, export.operation, export_id=export.id)


def send_export_notification(export):
    download_url = archive_url(
        export.content_hash,
        file_name=export.file_name,
        mime_type=export.mime_type,
        expire=export.expires_at,
    )
    params = dict(
        role=export.creator,
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
    email_role(export.creator, subject, html=html, plain=plain)
