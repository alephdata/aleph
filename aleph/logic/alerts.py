import logging
from pprint import pprint  # noqa
from elasticsearch import RequestError

from aleph.authz import Authz
from aleph.core import db, es
from aleph.model import Alert, Events, Entity
from aleph.index.indexes import entities_read_index
from aleph.index.util import unpack_result, authz_query
from aleph.logic.notifications import publish

log = logging.getLogger(__name__)


def get_alert(alert_id):
    alert = Alert.by_id(alert_id, deleted=True)
    if alert is not None:
        return alert.to_dict()


def check_alerts():
    """Go through all alerts."""
    for alert_id in list(Alert.all_ids()):
        check_alert(alert_id)


def check_alert(alert_id):
    alert = Alert.by_id(alert_id)
    if alert is None or alert.role is None:
        return
    log.info("Check alert [%s]: %s", alert.id, alert.query)
    authz = Authz.from_role(alert.role)
    try:
        query = alert_query(alert, authz)
        index = entities_read_index(schema=Entity.THING)
        result = es.search(index=index, body=query)
    except RequestError as re:
        log.error("Invalid query [%s]: %r", alert.query, re.error)
        alert.delete()
        db.session.commit()
        return

    for result in result.get('hits').get('hits', []):
        entity = unpack_result(result)
        if entity is None:
            continue
        log.info('Alert [%s]: %s', alert.query, entity.get('name'))
        params = {
            'alert': alert,
            'role': alert.role,
            'entity': entity.get('id')
        }
        publish(Events.MATCH_ALERT, params=params, channels=[alert.role])

    alert.update()
    db.session.commit()


def alert_query(alert, authz):
    """Construct a search query to find new matching entities and documents
    for a particular alert. Update handling is done via a timestamp of the
    latest known result."""
    # Many users have bookmarked complex queries, otherwise we'd use a
    # precise match query.
    queries = [{
        'query_string': {
            'query': alert.query,
            'lenient': True,
            'default_field': 'text',
            'default_operator': 'AND',
            'minimum_should_match': '90%'
        }
    }]
    filters = [authz_query(authz)]
    if alert.notified_at is not None:
        notified_at = alert.notified_at.isoformat()
        filters.append({'range': {'updated_at': {'gt': notified_at}}})
    return {
        'size': 50,
        '_source': {'includes': ['name']},
        'query': {
            'bool': {
                'should': queries,
                'filter': filters,
                'minimum_should_match': 1
            }
        }
    }
