import logging

from aleph.graph.schema import NodeType

log = logging.getLogger(__name__)


def _make_response(nodes, edges, limit, offset):
    """Helper to make query responses more uniform."""
    return {
        'status': 'ok',
        'limit': limit,
        'offset': offset,
        'nodes': nodes,
        'edges': edges
    }


def load_nodes(graph, collections, node_ids, labels, depth, limit, offset):
    q = "MATCH (n%s)-[:PART_OF]->(c1:Collection) " \
        "MATCH (n)-[r]-(p) " \
        "MATCH (p)-[:PART_OF]->(c2:Collection) " \
        "WHERE c1.alephCollection IN {acl} " \
        "AND c2.alephCollection IN {acl} " \
        "AND n.id IN {node_ids} " \
        "WITH n, count(r) AS deg " \
        "ORDER BY deg DESC " \
        "SKIP {offset} LIMIT {limit} " \
        "RETURN n, deg "
    if len(labels):
        labels = ':' + '|'.join(labels)
        q = q % labels
    else:
        q = q % ''
    cursor = graph.run(q, acl=collections,
                       limit=limit, offset=offset)
    nodes = []
    for row in cursor:
        node = NodeType.dict(row.get('n'))
        node['$degree'] = row.get('deg')
        nodes.append(node)
    return _make_response(nodes, [], limit=limit, offset=offset)


def suggest_nodes(graph, collections, prefix, labels, limit, offset):
    """Suggest nodes whose names match the given prefix.

    Returns the result sorted by the visible degree count of each node.
    """
    q = "MATCH (n%s)-[:PART_OF]->(c1:Collection) " \
        "MATCH (n)-[r]-(p) " \
        "MATCH (p)-[:PART_OF]->(c2:Collection) " \
        "WHERE c1.alephCollection IN {acl} " \
        "AND c2.alephCollection IN {acl} " \
        "AND n.name =~ {regex} " \
        "WITH n, count(r) AS deg " \
        "ORDER BY deg DESC " \
        "SKIP {offset} LIMIT {limit} " \
        "RETURN n, deg "
    if len(labels):
        labels = ':' + '|'.join(labels)
        q = q % labels
    else:
        q = q % ''
    regex = '(?i).*%s.*' % prefix
    cursor = graph.run(q, regex=regex, acl=collections,
                       limit=limit, offset=offset)
    nodes = []
    for row in cursor:
        node = NodeType.dict(row.get('n'))
        node['$degree'] = row.get('deg')
        nodes.append(node)
    return _make_response(nodes, [], limit=limit, offset=offset)
