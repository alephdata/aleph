import logging
from urllib import urlencode
from flask import request, render_template, current_app

from aleph.core import get_config, db, celery
from aleph.model import Role, Alert
from aleph.notify import notify_role
from aleph.search.documents import documents_query
from aleph.search.documents import execute_documents_alert_query

log = logging.getLogger(__name__)


@celery.task()
def check_alerts():
    for role_id, in Role.notifiable():
        with current_app.test_request_context('/'):
            role = Role.by_id(role_id)
            request.auth_role = role
            request.logged_in = True
            # FIXME: can't re-gain access to implicit oauth rules.
            # -> https://github.com/pudo/aleph/issues/14
            request.auth_roles = [Role.system(Role.SYSTEM_USER),
                                  Role.system(Role.SYSTEM_GUEST),
                                  role.id]
            check_role_alerts(role)


def make_document_query(alert):
    qs = {'dq': alert.query.get('q')}
    qs.update(alert.query)
    args = []
    for k, vs in qs.items():
        if isinstance(vs, (list, tuple, set)):
            for v in vs:
                args.append((k, v))
        else:
            args.append((k, vs))
    return urlencode(args)


def check_role_alerts(role):
    alerts = Alert.by_role(role).all()
    if not len(alerts):
        return
    log.info('Alerting %r, %d alerts...', role, len(alerts))
    for alert in alerts:
        q = documents_query(alert.query, newer_than=alert.notified_at)
        results = execute_documents_alert_query(alert.query, q)
        if results['total'] == 0:
            continue
        log.info('Found: %d new results for: %r', results['total'],
                 alert.query)
        alert.update()
        try:
            subject = '%s (%s new results)' % (alert.label, results['total'])
            html = render_template('alert.html', alert=alert, results=results,
                                   role=role, qs=make_document_query(alert),
                                   app_title=get_config('APP_TITLE'),
                                   app_url=get_config('APP_BASEURL'))
            notify_role(role, subject, html)
        except Exception as ex:
            log.exception(ex)
    db.session.commit()
