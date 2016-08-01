# coding: utf-8
from aleph.core import get_graph
from aleph.graph.schema import NodeType
from aleph.graph.entities import load_entities  # noqa
from aleph.graph.documents import load_documents  # noqa
from aleph.graph.mapping import Mapping  # noqa


def upgrade():
    graph = get_graph()
    if graph is None:
        return
    graph.delete_all()
    for node_type in NodeType.all():
        node_type.ensure_indices(graph)


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
