import logging
from urllib import urlencode
from flask import request, render_template, current_app

from aleph.core import get_config, db, celery
from aleph.model import Role, Alert
from aleph.notify import notify_role
from aleph.search.documents import alert_query

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
    return urlencode((('dq', alert.query_text),))


def check_role_alerts(role):
    alerts = Alert.by_role(role).all()
    if not len(alerts):
        return
    log.info('Alerting %r, %d alerts...', role, len(alerts))
    for alert in alerts:
        results = alert_query(alert)
        if results['total'] == 0:
            continue
        log.info('Found: %d new results for: %r', results['total'],
                 alert.label)
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
