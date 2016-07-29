# coding: utf-8
from aleph.graph.schema import NODE_TYPES
from aleph.graph.db import Vocab, ensure_index, get_graph  # noqa
from aleph.graph.entities import load_entities  # noqa
from aleph.graph.documents import load_documents  # noqa


def upgrade():
    graph = get_graph()
    if graph is None:
        return
    graph.delete_all()
    for node_type in NODE_TYPES:
        node_type.ensure_indices(graph)


def get_node_labels():
    return [n.name for n in NODE_TYPES if not n.hidden]


# minimal graph API:
# /api/1/collections/<id>/graph
#   -> return a basic set of all the nodes in this
#      collection - e.g. documents, entities, phones
#      must be paginated.
# /api/1/graph/node/<id>
#   -> return all the nodes adjacent to <id>, sorted
#      by degree
# /api/1/graph/complete?id=&length=<max_pathlen>
#   -> given a list of node IDs (via GET or POST),
#      return all connections between them.
# /api/1/graph/suggest?prefix=&label=
#   -> return all completions of the given prefix
#      for a node title. Optional filter by label type.

# Response format:
#
# nodes:
#  - xxx
# edges:
#  - xxx


def test():
    # from py2neo.database.cypher import cypher_repr
    graph = get_graph()
    collections = range(1, 100)
    collections = [251]
    # collections = cypher_repr(collections)
    # print cypher_repr(u"huhu this has ' quotäää")
    # return
    q = "MATCH (n:Entity)-[r]-(d:Document) " \
        "MATCH (n)-[:PART_OF]->(c1:Collection) " \
        "MATCH (d)-[:PART_OF]->(c2:Collection) " \
        "WHERE c1.alephCollection IN {acl} " \
        "AND c2.alephCollection IN {acl} " \
        "RETURN n, r, d LIMIT 5 "
    # q = q % (collections, collections)
    for res in graph.data(q, acl=collections):
        print dir(res.get('r'))
        print res.get('r').__uuid__
    # graph.delete_all()
