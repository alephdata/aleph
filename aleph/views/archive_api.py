import logging
from flask.wrappers import Response
from flask import Blueprint, redirect, send_file, request

from aleph.core import archive
from aleph.model import Audit
from aleph.logic.audit import record_audit
from aleph.logic.util import archive_claim
from aleph.views.util import require

log = logging.getLogger(__name__)
blueprint = Blueprint('archive_api', __name__)


@blueprint.route('/api/2/archive')
def retrieve():
    claim = request.args.get('claim')
    role_id, content_hash, file_name, mime_type = archive_claim(claim)
    require(request.authz.id == role_id)
    record_audit(Audit.ACT_ARCHIVE, content_hash=content_hash)
    url = archive.generate_url(content_hash,
                               file_name=file_name,
                               mime_type=mime_type)
    if url is not None:
        return redirect(url)
    try:
        local_path = archive.load_file(content_hash)
        if local_path is None:
            return Response(status=404)
        return send_file(local_path,
                         as_attachment=True,
                         conditional=True,
                         attachment_filename=file_name,
                         mimetype=mime_type)
    finally:
        archive.cleanup_file(content_hash)
