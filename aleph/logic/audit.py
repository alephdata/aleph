import logging
from flask import request

from aleph.core import db, celery
from aleph.model import Audit

log = logging.getLogger(__name__)


def record_audit(activity, keys=None, **data):
    keys = keys or data.keys()
    record_audit_task.delay(activity,
                            request.session_id,
                            request.authz.id,
                            data,
                            keys)


@celery.task(priority=2)
def record_audit_task(activity, session_id, role_id, data, keys):
    log.debug("Audit record [%s]: %s (%s)", session_id, activity, role_id)
    Audit.save(activity, session_id, role_id, data, keys)
    db.session.commit()
