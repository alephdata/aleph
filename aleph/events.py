from aleph.core import db, celery, USER_QUEUE, USER_ROUTING_KEY
from aleph.model import EventLog


def log_event(request, role_id=None, **data):
    path = '%s %s' % (request.method, request.full_path)
    if request.authz.logged_in:
        role_id = request.authz.role.id

    source_ip = None
    if len(request.access_route):
        source_ip = request.access_route[0]

    if request.method in ['GET']:
        query = request.args.to_dict(flat=False)
    else:
        if request.is_json:
            query = request.get_json()
        else:
            query = request.values.to_dict(flat=False)
    args = [request.endpoint, path, source_ip, query, data, role_id]
    save_event.apply_async(args,
                           queue=USER_QUEUE,
                           routing_key=USER_ROUTING_KEY)


@celery.task()
def save_event(action, path, source_ip, query, data, role_id):
    EventLog.emit(action, path, source_ip=source_ip,
                  query=query, data=data, role_id=role_id)
    db.session.commit()
