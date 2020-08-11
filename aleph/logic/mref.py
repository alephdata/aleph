import logging
from pprint import pprint  # noqa
from followthemoney import model
from followthemoney.exc import InvalidData
from followthemoney.types import registry
from followthemoney.helpers import name_entity

from aleph.model import Entity
from aleph.index.entities import iter_proxies
from aleph.logic.aggregator import get_aggregator
from aleph.logic.collections import reindex_collection
from aleph.logic.xref import _query_item
from aleph.index import xref as index


log = logging.getLogger(__name__)
ORIGIN = "xref"


def combine_schemata(*schemata):
    schema = Entity.LEGAL_ENTITY
    for other in schemata:
        try:
            schema = model.common_schema(schema, other)
        except InvalidData:
            schema = Entity.LEGAL_ENTITY
    return model.get(schema)


def _iter_mentions(collection):
    """Combine mentions into pseudo-entities used for xref."""
    proxy = model.make_entity(Entity.LEGAL_ENTITY)
    for mention in iter_proxies(
        collection_id=collection.id,
        schemata=["Mention"],
        sort={"properties.resolved": "desc"},
    ):
        if mention.first("resolved") != proxy.id:
            if proxy.id is not None:
                yield proxy
            proxy = model.make_entity(Entity.LEGAL_ENTITY)
            proxy.id = mention.first("resolved")
        proxy.schema = combine_schemata(proxy.schema, mention.get("detectedSchema"))
        proxy.add("name", mention.get("name"))
        proxy.add("country", mention.get("contextCountry"))
    if proxy.id is not None:
        yield proxy


def _generate_matches(collection):
    aggregator = get_aggregator(collection, origin=ORIGIN)
    writer = aggregator.bulk()
    for proxy in _iter_mentions(collection):
        log.debug("Mention de-ref: %r", proxy)

        schemata = set()
        countries = set()
        for score, _, collection_id, match in _query_item(proxy):
            schemata.add(match.schema)
            countries.update(match.get_type_values(registry.country))
            yield score, proxy, collection_id, match
        if len(schemata):
            # Assign only those countries that are backed by one of
            # the matches:
            countries = countries.intersection(proxy.get("country"))
            proxy.set("country", countries)
            # Try to be more specific about schema:
            proxy.schema = combine_schemata(proxy.schema, *schemata)
            # Pick a principal name:
            proxy = name_entity(proxy)
            writer.put(proxy, fragment="mention")
            pprint(proxy.to_dict())
    writer.flush()
    aggregator.close()


def collection_mentions(collection):
    index.index_matches(collection, _generate_matches(collection))
    reindex_collection(collection, sync=False)
