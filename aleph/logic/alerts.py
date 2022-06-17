# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

import logging
from pprint import pprint  # noqa
from elasticsearch import RequestError

from aleph.authz import Authz
from aleph.core import db, es
from aleph.model import Alert, Events, Entity
from aleph.index.indexes import entities_read_index
from aleph.index.util import unpack_result, authz_query, query_string_query
from aleph.logic.notifications import publish

log = logging.getLogger(__name__)


def get_alert(alert_id):
    alert = Alert.by_id(alert_id)
    if alert is not None:
        return alert.to_dict()


def check_alerts():
    """Go through all alerts."""
    for alert in Alert.all(deleted=False):
        check_alert(alert)
    db.session.commit()


def check_alert(alert):
    role = alert.role
    if role is None:
        return
    log.debug("Check alert [%s]: %s", alert.id, alert.query)
    authz = Authz.from_role(role)
    try:
        query = alert_query(alert, authz)
        index = entities_read_index(schema=Entity.THING)
        result = es.search(index=index, body=query)
    except RequestError as re:
        log.error("Invalid query [%s]: %r", alert.query, re.error)
        alert.delete()
        return

    for result in result.get("hits").get("hits", []):
        entity = unpack_result(result)
        if entity is None:
            continue
        log.info("Alert [%s]: %s", alert.query, entity.get("id"))
        params = {
            "alert": alert,
            "role": role,
            "entity": entity.get("id"),
            "collection": entity.get("collection_id"),
        }
        channels = [role]
        # channels.append(channel_tag(collection_id, Collection))
        publish(Events.MATCH_ALERT, params=params, channels=channels)

    alert.update()
    db.session.flush()


def alert_query(alert, authz):
    """Construct a search query to find new matching entities and documents
    for a particular alert. Update handling is done via a timestamp of the
    latest known result."""
    # Many users have bookmarked complex queries, otherwise we'd use a
    # precise match query.
    filters = [authz_query(authz)]
    if alert.notified_at is not None:
        notified_at = alert.notified_at.isoformat()
        filters.append({"range": {"updated_at": {"gt": notified_at}}})
    return {
        "size": 50,
        "_source": {"includes": ["collection_id"]},
        "query": {
            "bool": {
                "should": [query_string_query("text", alert.query)],
                "filter": filters,
                "minimum_should_match": 1,
            }
        },
    }
