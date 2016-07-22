from apikit import request_data

from aleph.core import db, celery
from aleph.model import EventLog


def log_event(request, role_id=None, **data):
    path = '%s %s' % (request.method, request.path)
    if len(request.query_string.strip()):
        path = '%s?%s' % (path, request.query_string)
    if request.auth_role:
        role_id = request.auth_role.id

    source_ip = None
    if len(request.access_route):
        source_ip = request.access_route[0]

    if request.method in ['GET']:
        query = request.args.to_dict(flat=False)
    else:
        query = request_data()
    save_event.delay(request.endpoint, path, source_ip,
                     query, data, role_id)


@celery.task()
def save_event(action, path, source_ip, query, data, role_id):
    EventLog.emit(action, path, source_ip=source_ip,
                  query=query, data=data, role_id=role_id)
    db.session.commit()
