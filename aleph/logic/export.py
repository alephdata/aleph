import os
import types
import shutil
import logging
import zipstream
from pprint import pformat  # noqa
from tempfile import mkdtemp
from flask import render_template
from followthemoney import model
from followthemoney.helpers import entity_filename
from followthemoney.export.excel import ExcelExporter
from servicelayer.archive.util import ensure_path

from aleph.core import archive, db, cache, url_for, settings
from aleph.authz import Authz
from aleph.model import Collection, Export, Events, Role, Status
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


def write_document(export_dir, zf, collection, entity, fp):
    content_hash = entity.first("contentHash", quiet=True)
    if content_hash is None:
        return
    file_name = entity_filename(entity)
    arcname = "{0}-{1}".format(entity.id, file_name)
    arcname = os.path.join(collection.get("label"), arcname)
    try:
        local_path = archive.load_file(content_hash, temp_path=export_dir)
        if local_path is not None and os.path.exists(local_path):
            zf.write(local_path, arcname=arcname)
            for data in zf.flush():
                fp.write(data)
    finally:
        archive.cleanup_file(content_hash, temp_path=export_dir)


def export_entities(export_id, result):
    from aleph.logic import resolver

    export_dir = ensure_path(mkdtemp(prefix="aleph.export."))
    try:
        entities = []
        stub = types.SimpleNamespace(result=result)
        for entity in result["results"]:
            resolver.queue(stub, Collection, entity.get("collection_id"))
            entities.append(model.get_proxy(entity))
        resolver.resolve(stub)

        file_path = export_dir.joinpath("query-export.zip")
        with open(file_path, "wb") as fp:
            zf = zipstream.ZipFile(mode="w")
            exporter = ExcelExporter(None, extra=EXTRA_HEADERS)
            for entity in entities:
                collection_id = entity.context.get("collection_id")
                collection = resolver.get(stub, Collection, collection_id)
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
    export.set_filepath(file_path)
    export.publish()
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
