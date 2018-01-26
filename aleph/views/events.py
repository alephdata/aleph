from flask import request, Blueprint

from aleph.core import db, celery, settings
from aleph.core import USER_QUEUE, USER_ROUTING_KEY
from aleph.model import EventLog

blueprint = Blueprint('events', __name__)


@blueprint.after_app_request
def log_response(resp):
    if request.endpoint == 'static':
        return resp

    if settings.DEBUG:
        return resp

    source_ip = None
    if len(request.access_route):
        source_ip = request.access_route[0]

    query = request.args.to_dict(flat=False)
    if request.method in ['POST', 'PUT']:
        if request.is_json:
            query = request.get_json()
        else:
            query = request.values.to_dict(flat=False)

    role_id = None
    if hasattr(request, 'authz'):
        role_id = request.authz.id

    args = [request.endpoint,
            '%s %s' % (request.method, request.full_path),
            source_ip,
            query,
            request.view_args,
            role_id]
    save_event.apply_async(args,
                           queue=USER_QUEUE,
                           routing_key=USER_ROUTING_KEY)
    return resp


@celery.task()
def save_event(action, path, source_ip, query, data, role_id):
    EventLog.emit(action, path, source_ip=source_ip,
                  query=query, data=data, role_id=role_id)
    db.session.commit()
