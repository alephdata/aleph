import logging
from pprint import pprint  # noqa
from elasticsearch.helpers import scan

from aleph.authz import Authz
from aleph.core import db, es
from aleph.model import Alert, Events
from aleph.index.core import entities_index
from aleph.index.util import unpack_result, authz_query
from aleph.logic.notifications import publish

log = logging.getLogger(__name__)


def check_alerts():
    """Go through all alerts."""
    Alert.dedupe()
    db.session.commit()
    for alert_id in Alert.all_ids():
        check_alert(alert_id)


def check_alert(alert_id):
    alert = Alert.by_id(alert_id)
    if alert is None:
        return
    authz = Authz.from_role(alert.role)
    query = alert_query(alert, authz)
    found = 0
    for result in scan(es, query=query, index=entities_index()):
        entity = unpack_result(result)
        found += 1
        params = {
            'alert': alert,
            'role': alert.role,
            'entity': entity
        }
        publish(Events.MATCH_ALERT,
                actor_id=entity.get('uploader_id'),
                params=params)
        db.session.commit()

    alert.update()
    log.info('Found %d new results for: %s', found, alert.label)
    db.session.commit()
    db.session.close()


def alert_query(alert, authz):
    """Construct a search query to find new matching entities and documents
    for a particular alert. Update handling is done via a timestamp of the
    latest known result."""
    # Many users have bookmarked complex queries, otherwise we'd use a
    # precise match query.
    query = {
        'simple_query_string': {
            'query': alert.query_text,
            'fields': ['text'],
            'default_operator': 'AND',
            'minimum_should_match': '90%'
        }
    }
    filter_since = {
        'range': {
            'created_at': {'gt': alert.notified_at}
        }
    }
    return {
        'query': {
            'bool': {
                'should': [query],
                'filter': [filter_since, authz_query(authz)],
                'minimum_should_match': 1
            }
        }
    }
