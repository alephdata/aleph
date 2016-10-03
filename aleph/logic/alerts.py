import logging
from urllib import quote_plus
from flask import request, render_template, current_app

from aleph.core import get_app_title, get_app_url, db, celery
from aleph.model import Role, Alert, Collection
from aleph.notify import notify_role
from aleph.search.alerts import alert_query

log = logging.getLogger(__name__)


@celery.task()
def check_alerts():
    """Go through all users and execute their alerts."""
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


def format_results(alert, results):
    # used to activate highlighting in results pages:
    app_url = get_app_url()
    qs = 'dq=%s' % quote_plus(alert.query_text or '')
    output = []
    for result in results['results']:
        collection_id = result.pop('source_collection_id', None)
        if not collection_id:
            continue
        result['collection'] = Collection.by_id(collection_id)

        # generate document URL:
        if 'tabular' == result.get('type'):
            result['url'] = '%stabular/%s/0?%s' % (app_url, result['id'], qs)
        else:
            result['url'] = '%stext/%s?%s' % (app_url, result['id'], qs)

        # preview snippets:
        result['snippets'] = []
        for record in result['records'].get('results', []):
            result['snippets'].append(record['text'])
        output.append(result)
    return output


def check_role_alerts(role):
    alerts = Alert.by_role(role).all()
    if not len(alerts):
        return
    log.info('Alerting %r, %d alerts...', role, len(alerts))
    for alert in alerts:
        results = alert_query(alert)
        if results['total'] == 0:
            continue
        log.info('Found %d new results for: %r', results['total'], alert.label)
        alert.update()
        try:
            subject = '%s (%s new results)' % (alert.label, results['total'])
            
            html = render_template('alert.html', alert=alert, role=role,
                                   total=results.get('total'),
                                   results=format_results(alert, results),
                                   app_title=get_app_title(),
                                   app_url=get_app_url())
            notify_role(role, subject, html)
        except Exception as ex:
            log.exception(ex)
    db.session.commit()
