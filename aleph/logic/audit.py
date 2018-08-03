import logging
import hashlib
import uuid

from flask import request

from aleph.core import db, celery
from aleph.model import Audit

log = logging.getLogger(__name__)

ACTIVITY_SCHEMA = {
    "USER.LOGIN": [],
    "USER.SEARCH": [
        "text", "prefix", "offset", "limit", "filters",
        "sorts", "empties", "exclude"
    ],
    "USER.VIEW_COLLECTION": ["collection_id", ],
    "USER.VIEW_DOCUMENT": ["document_id", ]
}


def _get_session_id(request):
    session_id = request.headers.get('Aleph-Session-ID')
    if not session_id:
        user_agent = request.user_agent or ''
        user_ip = request.remote_addr or ''
        if user_agent or user_ip:
            session_id = hashlib.new(user_agent).update(user_ip).hexdigest()
        else:
            session_id = uuid.uuid4().hex
    return session_id


def record_audit(activity_type, activity_data):
    if activity_type not in ACTIVITY_SCHEMA:
        raise ValueError("Unknown activity type: %s" % activity_type)
    data = {
        "activity_type": activity_type,
        "role_id": request.authz.id,
        "session_id": _get_session_id(request)
    }
    for expected_value in ACTIVITY_SCHEMA[activity_type]:
        if expected_value not in activity_data:
            raise ValueError("Missing activity data: %s" % expected_value)
    data.update(activity_data)
    record_audit_task.delay(data)


@celery.task(priority=1)
def record_audit_task(data):
    Audit.create_or_update(data)
    db.session.commit()
