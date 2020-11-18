import logging
from banal import ensure_list
from pprint import pformat  # noqa
from followthemoney.graph import Node

from aleph.logic.graph import Graph

log = logging.getLogger(__name__)


def get_properties(proxies, edge_types, properties):
    properties = ensure_list(properties)
    for proxy in ensure_list(proxies):
        for prop in proxy.schema.properties.values():
            if prop.type not in edge_types:
                continue
            if len(properties) and prop.name not in properties:
                continue
            yield (proxy, prop)


def get_adjacent(graph, proxy, prop):
    # Too much effort to do this right. This works, too:
    proxies = set()
    node = Node.from_proxy(proxy)
    for edge in graph.get_adjacent(node, prop=prop):
        for part in (edge.proxy, edge.source.proxy, edge.target.proxy):
            if part is not None and part != proxy:
                proxies.add(part)
    return proxies


def expand_proxies(
    proxies, collection_ids, edge_types, limit, properties=None, authz=None
):
    """Expand an entity's graph to find adjacent entities that are connected
    by a common property value(eg: having the same email or phone number), a
    property (eg: Passport entity linked to a Person) or an Entity type edge.
    (eg: Person connected to Company through Directorship)

    collection_ids: list of collection_ids to search
    edge_types: list of FtM Types to expand as edges
    properties: list of FtM Properties to expand as edges.
    limit: max number of entities to return
    """
    graph = Graph(edge_types=edge_types)
    query = graph.query(authz=authz, collection_ids=collection_ids)

    # Query for reverse properties
    for (proxy, prop) in get_properties(proxies, graph.edge_types, properties):
        graph.add(proxy)
        if prop.stub:
            node = Node.from_proxy(proxy)
            query.edge(node, prop.reverse, limit=limit, count=True)

    query.execute()

    # Fill in missing graph entities:
    if limit > 0:
        graph.resolve()

    props = {}
    for (proxy, prop) in get_properties(proxies, graph.edge_types, properties):
        if prop not in props:
            props[prop] = {"count": 0, "entities": set()}
        count = len(proxy.get(prop))
        if prop.stub:
            for res in query.patterns:
                if res.prop == prop.reverse:
                    count = res.count

        props[prop]["count"] += count
        props[prop]["entities"].update(get_adjacent(graph, proxy, prop))

    results = []
    for prop, data in props.items():
        if data["count"] > 0:
            item = {
                "property": prop.name,
                "count": data["count"],
                "entities": [e.to_dict() for e in data["entities"]],
            }
            results.append(item)
    return results
