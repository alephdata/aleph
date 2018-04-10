import logging
from pprint import pprint  # noqa
from banal import ensure_list
from elasticsearch.helpers import scan

from aleph.authz import Authz
from aleph.core import db, es, celery
from aleph.model import Role, Alert, Events
from aleph.index.core import entities_index
from aleph.index.entities import get_entity
from aleph.index.util import unpack_result, authz_query
from aleph.logic.notifications import publish

log = logging.getLogger(__name__)


@celery.task()
def check_alerts():
    """Go through all users and execute their alerts."""
    for role in Role.all():
        authz = Authz(role=role)
        for alert in Alert.by_role(role).all():
            check_alert(authz, alert)


def check_alert(authz, alert):
    query = alert_query(alert, authz)
    for result in scan(es, query=query, index=entities_index()):
        entity = unpack_result(result)
        params = {
            'alert': alert,
            'role': authz.role,
            'entity': entity
        }
        publish(Events.MATCH_ALERT,
                actor_id=entity.get('uploader_id'),
                params=params)

    alert.update()
    # log.info('Found %d new results for: %s', results['total'], alert.label)
    db.session.commit()


def alert_query(alert, authz):
    """Construct a search query to find new matching entities and documents
    for a particular alert. Update handling is done via a timestamp of the
    latest known result."""
    entity = get_entity(alert.entity_id)
    clauses = []
    if entity is None and not alert.query_text:
        # TODO: do we want to delete the alert here?
        clauses.append({'match_none': {}})

    if alert.query_text:
        # Many users have bookmarked complex queries, otherwise we'd use a
        # precise match query.
        clauses.append({
            'simple_query_string': {
                'query': alert.query_text,
                'fields': ['text'],
                'default_operator': 'AND',
                'minimum_should_match': '90%'
            }
        })

    if entity is not None:
        for field in ['names', 'fingerprints', 'emails', 'phones']:
            for value in ensure_list(entity.get(field)):
                clauses.append({'term': {field: value}})
                clauses.append({
                    "multi_match": {
                        "query": value,
                        "fields": ['text']
                    }
                })

    return {
        'query': {
            'bool': {
                'should': clauses,
                'filter': [
                    {
                        'range': {
                            'created_at': {'gt': alert.notified_at}
                        }
                    },
                    authz_query(authz)
                ],
                'minimum_should_match': 1
            }
        }
    }
