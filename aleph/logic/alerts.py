import logging
from pprint import pprint  # noqa
from flask import render_template, current_app

from aleph.authz import Authz
from aleph.core import app_title, app_url, db, celery
from aleph.model import Role, Alert, Collection
from aleph.notify import notify_role
from aleph.index.entities import get_entity
from aleph.index.util import unpack_result
from aleph.search import AlertDocumentsQuery, SearchQueryParser
from aleph.logic.documents import document_url

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
    output = []
    for result in results.get('hits', []):
        document = unpack_result(result)
        # generate document URL:
        document['url'] = document_url(document['id'], dq=alert.query_text)
        collection = Collection.by_id(document.pop('collection_id'))
        if not collection:
            continue
        document['collection'] = collection

        # preview snippets:
        result['snippets'] = []
        for field, snippets in result.get('highlight', {}).items():
            result['snippets'].extend(snippets)
        output.append(document)
    return output


def check_role_alerts(authz):
    alerts = Alert.by_role(authz.role).all()
    if not len(alerts):
        return
    log.info('Alerting %r, %d alerts...', authz.role, len(alerts))
    for alert in alerts:
        args = {'q': alert.query_text}
        entity = get_entity(alert.entity_id) if alert.entity_id else None
        state = SearchQueryParser(args, authz)
        query = AlertDocumentsQuery(state,
                                    entity=entity,
                                    since=alert.notified_at)
        results = query.search().get('hits')
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
