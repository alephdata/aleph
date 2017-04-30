import logging
from urllib import quote_plus
from flask import render_template, current_app

from aleph.authz import Authz
from aleph.core import app_title, app_url, db, celery
from aleph.model import Role, Alert, Collection
from aleph.notify import notify_role
from aleph.search import QueryState, documents_query

log = logging.getLogger(__name__)


@celery.task()
def check_alerts():
    """Go through all users and execute their alerts."""
    for role_id, in Role.notifiable():
        with current_app.test_request_context('/'):
            role = Role.by_id(role_id)
            authz = Authz(role=role)
            check_role_alerts(authz)


def format_results(alert, results):
    # used to activate highlighting in results pages:
    dq = alert.query_text or ''
    qs = 'dq=%s' % quote_plus(dq.encode('utf-8'))
    output = []
    for result in results['results']:
        collection_id = result.pop('collection_id', None)
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


def check_role_alerts(authz):
    alerts = Alert.by_role(authz.role).all()
    if not len(alerts):
        return
    log.info('Alerting %r, %d alerts...', authz.role, len(alerts))
    for alert in alerts:
        args = {
            'q': alert.query_text,
            'filter:entities.id': alert.entity_id,
            'limit': 50
        }
        state = QueryState(args, authz)
        results = documents_query(state, since=alert.notified_at)
        if results['total'] == 0:
            continue
        log.info('Found %d new results for: %r', results['total'], alert.label)
        alert.update()
        try:
            subject = '%s (%s new results)' % (alert.label, results['total'])
            html = render_template('email/alert.html',
                                   alert=alert,
                                   role=authz.role,
                                   total=results.get('total'),
                                   results=format_results(alert, results),
                                   app_title=app_title,
                                   app_url=app_url)
            notify_role(authz.role, subject, html)
        except Exception as ex:
            log.exception(ex)
    db.session.commit()
