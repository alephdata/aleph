import logging
from pprint import pprint  # noqa
from flask import render_template, current_app

from aleph.authz import Authz
from aleph.core import settings, app_ui_url, db, celery
from aleph.model import Role, Alert, Events, Collection
from aleph.notify import notify_role
from aleph.index.entities import get_entity
from aleph.index.util import unpack_result
from aleph.search import AlertDocumentsQuery, SearchQueryParser
from aleph.logic.notifications import publish
from aleph.logic.documents import document_url
from aleph.logic.collections import collection_url

log = logging.getLogger(__name__)


@celery.task()
def check_alerts():
    """Go through all users and execute their alerts."""
    for role in Role.all():
        authz = Authz(role=role)
        for alert in Alert.by_role(role).all():
            check_alert(authz, alert)


def check_alert(authz, alert):
    entity = get_entity(alert.entity_id) if alert.entity_id else None
    query = {'q': alert.query_text}
    state = SearchQueryParser(query, authz)
    query = AlertDocumentsQuery(state,
                                entity=entity,
                                since=alert.notified_at)
    results = query.search().get('hits')
    for result in results.get('hits', []):
        document = unpack_result(result)
        actor_id = document.get('uploader_id')
        params = {
            'alert': alert,
            'role': authz.role,
            'entity': document
        }
        publish(Events.MATCH_ALERT, actor_id, params=params)

    alert.update()
    log.info('Found %d new results for: %s', results['total'], alert.label)
    db.session.commit()
