import logging
from urllib import urlencode
from flask import request, render_template

from aleph.core import app, db, celery, system_role
from aleph.model import Role, Alert
from aleph.notify import notify_role
from aleph.search.documents import documents_query
from aleph.search.documents import execute_documents_alert_query

log = logging.getLogger(__name__)


@celery.task()
def check_alerts():
    for role in Role.all():
        with app.test_request_context('/'):
            request.auth_role = role
            request.logged_in = True
            # FIXME: can't re-gain access to implicit oauth rules.
            request.auth_roles = [system_role(Role.SYSTEM_USER),
                                  system_role(Role.SYSTEM_GUEST),
                                  role.id]
            if not role.email:
                log.info("No email: %r", role)
                continue
            check_role_alerts(role)


def check_role_alerts(role):
    alerts = Alert.by_role(role).all()
    log.info('Alerting %r, %d alerts...', role, len(alerts))
    for alert in alerts:
        q = documents_query(alert.query, min_id=alert.max_id)
        results = execute_documents_alert_query(alert.query, q)
        if results['total'] == 0:
            continue
        subject = '%s (%s new results)' % (alert.label, results['total'])
        qs = {'dq': alert.query.get('q')}
        qs.update(alert.query)
        args = []
        for k, vs in qs.items():
            if isinstance(vs, (list, tuple, set)):
                for v in vs:
                    args.append((k, v))
            else:
                args.append((k, vs))
        qs = urlencode(args)
        html = render_template('alert.html', alert=alert, results=results,
                               role=role, qs=qs,
                               app_title=app.config.get('APP_TITLE'),
                               app_url=app.config.get('APP_BASEURL'))
        notify_role(role, subject, html)
        alert.update()
    db.session.commit()
