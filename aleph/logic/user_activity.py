from aleph.core import db, celery
from aleph.model import UserActivity


ACTIVITY_SCHEMA = {
    "USER.LOGIN": [],
    "USER.SEARCH": ["query_string", "filters"],
    "USER.VIEW_COLLECTION": ["collection_id", ],
    "USER.VIEW_DOCUMENT": ["document_id", ]
}


@celery.task(priority=1)
def record_user_activity(activity_type, activity_data, role_id):
    if activity_type not in ACTIVITY_SCHEMA:
        raise ValueError("Unknown activity type: %s" % activity_type)
    data = {"activity_type": activity_type}
    for expected_value in ACTIVITY_SCHEMA[activity_type]:
        if expected_value not in activity_data:
            raise ValueError("Missing activity data: %s" % expected_value)
    data.update(activity_data)
    UserActivity.create(data, role_id)
    db.session.commit()
