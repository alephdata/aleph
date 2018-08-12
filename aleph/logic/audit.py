import logging
from banal import hash_data

from flask import request

from aleph.core import db, celery
from aleph.model import Audit

log = logging.getLogger(__name__)


def _get_session_id(request):
    session_id = request.headers.get('X-Aleph-Session')
    if not session_id:
        session_id = hash_data([request.remote_addr,
                                request.accept_languages,
                                request.user_agent])
    return session_id


def record_audit(activity, keys=None, **data):
    keys = keys or data.keys()
    session_id = _get_session_id(request)
    role_id = request.authz.id
    record_audit_task.delay(activity, session_id, role_id, data, keys)


@celery.task(priority=2)
def record_audit_task(activity, session_id, role_id, data, keys):
    log.debug("Audit record [%s]: %s (%s)", session_id, activity, role_id)
    Audit.save(activity, session_id, role_id, data, keys)
    db.session.commit()
