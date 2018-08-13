import logging
from flask import request
from datetime import datetime

from aleph.core import db, celery
from aleph.model import Audit

log = logging.getLogger(__name__)


def record_audit(activity, keys=None, **data):
    keys = keys or list(data.keys())
    timestamp = datetime.utcnow().timestamp()
    record_audit_task.delay(activity,
                            request.session_id,
                            request.authz.id,
                            timestamp,
                            data,
                            keys)


@celery.task(priority=2)
def record_audit_task(activity, session_id, role_id, timestamp, data, keys):
    log.debug("Audit record [%s]: %s (%s)", session_id, activity, role_id)
    timestamp = datetime.fromtimestamp(timestamp)
    Audit.save(activity, session_id, role_id, timestamp, data, keys)
    db.session.commit()
