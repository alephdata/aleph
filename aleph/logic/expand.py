import logging
from pprint import pformat  # noqa
from banal import ensure_list
from followthemoney import model
from followthemoney.graph import Node
from followthemoney.types import registry

from aleph.core import es
from aleph.settings import SETTINGS
from aleph.model import Entity
from aleph.logic.graph import Graph
from aleph.index.entities import ENTITY_SOURCE
from aleph.index.indexes import entities_read_index
from aleph.index.util import field_filter_query, authz_query, unpack_result

log = logging.getLogger(__name__)
DEFAULT_TAGS = set(registry.pivots)
DEFAULT_TAGS.remove(registry.entity)
FILTERS_COUNT_LIMIT = SETTINGS.INDEX_EXPAND_CLAUSE_LIMIT


def _expand_properties(proxies, properties):
    properties = ensure_list(properties)
    props = set()
    for proxy in ensure_list(proxies):
        for prop in proxy.schema.properties.values():
            if prop.type != registry.entity:
                continue
            if len(properties) and prop.name not in properties:
                continue
            props.add(prop)
    return props


def _expand_adjacent(graph, proxy, prop):
    """Return all proxies related to the given proxy/prop combo as an array.
    This creates the very awkward return format for the API, which simply
    gives you a list of entities and lets the UI put them in some meaningful
    relation. Gotta revise this some day...."""
    # Too much effort to do this right. This works, too:
    adjacent = set()
    node = Node.from_proxy(proxy)
    for edge in graph.get_adjacent(node, prop=prop):
        for part in (edge.proxy, edge.source.proxy, edge.target.proxy):
            if part is not None and part != proxy:
                adjacent.add(part)
    return adjacent


def expand_proxies(proxies, authz, properties=None, limit=0):
    """Expand an entity's graph to find adjacent entities that are connected
    by a property (eg: Passport entity linked to a Person) or an Entity type
    edge (eg: Person connected to Company through Directorship).

    properties: list of FtM Properties to expand as edges.
    limit: max number of entities to return
    """
    graph = Graph(edge_types=(registry.entity,))
    for proxy in proxies:
        graph.add(proxy)

    queries = {}
    entity_ids = [proxy.id for proxy in proxies]
    # First, find all the entities pointing to the current one via a stub
    # property. This will return the intermediate edge entities in some
    # cases - then we'll use graph.resolve() to get the far end of the
    # edge.
    for prop in _expand_properties(proxies, properties):
        if not prop.stub:
            continue
        index = entities_read_index(prop.reverse.schema)
        field = "properties.%s" % prop.reverse.name
        queries[(index, prop.qname)] = field_filter_query(field, entity_ids)

    entities, counts = _counted_msearch(queries, authz, limit=limit)
    for entity in entities:
        graph.add(model.get_proxy(entity))

    if limit > 0:
        graph.resolve()

    results = []
    for prop in _expand_properties(proxies, properties):
        count = counts.get(prop.qname, 0)
        if not prop.stub:
            count = sum(len(p.get(prop)) for p in proxies)

        entities = set()
        for proxy in proxies:
            entities.update(_expand_adjacent(graph, proxy, prop))

        if count > 0:
            item = {
                "property": prop.name,
                "count": count,
                "entities": entities,
            }
            results.append(item)

    # pprint(results)
    return results


def entity_tags(proxy, authz, prop_types=DEFAULT_TAGS):
    """For a given proxy, determine how many other mentions exist for each
    property value associated, if it is one of a set of types."""
    queries = {}
    lookup = {}
    values = set()
    for prop, value in proxy.itervalues():
        if prop.type not in prop_types:
            continue
        if not prop.matchable:
            continue
        if prop.specificity(value) > 0.1:
            values.add((prop.type, value))

    type_names = [t.name for t in prop_types]
    log.debug("Tags[%s]: %s values", type_names, len(values))
    for (type_, value) in values:
        key = type_.node_id(value)
        lookup[key] = (type_, value)
        # Determine which indexes may contain further mentions (only things).
        schemata = model.get_type_schemata(type_)
        schemata = [s for s in schemata if s.is_a(Entity.THING)]
        index = entities_read_index(schemata)
        queries[(index, key)] = field_filter_query(type_.group, value)

    _, counts = _counted_msearch(queries, authz)
    results = []
    for key, count in counts.items():
        if count > 1:
            type_, value = lookup[key]
            result = {
                "id": key,
                "field": type_.group,
                "value": value,
                "count": count - 1,
            }
            results.append(result)

    results.sort(key=lambda p: p["count"], reverse=True)
    # pprint(results)
    return results


def _counted_msearch(queries, authz, limit=0):
    """Run batched queries to count or retrieve entities with certain
    property values."""
    # The default case for this is that we want to retrieve only the
    # counts for a bunch of filtered sub-queries. In this case, we can
    # group the queries by the affected index.
    # In some cases, the expand API wants to actually retrieve entities.
    # Then, we need to make one query per filter.
    grouped = {}
    for (index, key), query in sorted(queries.items()):
        group = index if limit == 0 else (index, key)
        if group not in grouped:
            grouped[group] = {
                "index": index,
                "filters": [query],
                "counts": {key: query},
            }
        else:
            grouped[group]["filters"].append(query)
            grouped[group]["counts"][key] = query

    log.debug("Counts: %s queries, %s groups", len(queries), len(grouped))

    body = []
    for group in grouped.values():
        index = {"index": group.get("index")}
        filters = group.get("filters")
        counts = list(group.get("counts").items())

        # Having too many filters in a single query increase heap memory
        # usage in ElasticSearch. This can lead to OOM errors in the worst
        # case. So we group the filters into smaller batches.
        while len(filters) > 0:
            filters_batch = filters[:FILTERS_COUNT_LIMIT]
            filters = filters[FILTERS_COUNT_LIMIT:]
            counts_batch = dict(counts[:FILTERS_COUNT_LIMIT])
            counts = counts[FILTERS_COUNT_LIMIT:]
            if limit == 0 and len(filters_batch) > 1:
                filters_batch = [
                    {"bool": {"should": filters_batch, "minimum_should_match": 1}}
                ]
            filters_batch.append(authz_query(authz))
            query = {
                "size": limit,
                "query": {"bool": {"filter": filters_batch}},
                "aggs": {"counts": {"filters": {"filters": counts_batch}}},
                "_source": ENTITY_SOURCE,
            }
            body.append(index)
            body.append(query)

    log.debug("Counts: %s grouped queries", len(body) // 2)

    counts = {}
    # FIXME: This doesn't actually retain context on which query a particular
    # entity is a result from. Doesn't matter if all we do in the end is stuff
    # everything into an FtMGraph and then traverse for adjacency.
    entities = []

    if not len(body):
        return entities, counts

    # log.debug(pformat(body))
    response = es.msearch(body=body)
    # log.debug(pformat(response))
    for resp in response.get("responses", []):
        for result in resp.get("hits", {}).get("hits", []):
            entities.append(unpack_result(result))
        buckets = resp.get("aggregations", {}).get("counts", {}).get("buckets", {})
        for key, count in buckets.items():
            counts[key] = count.get("doc_count", 0)
    return entities, counts
