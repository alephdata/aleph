from banal import hash_data
from pprint import pprint  # noqa
from followthemoney import model
from followthemoney.types import registry
from followthemoney.graph import Graph, Node

from aleph.index.indexes import entities_read_index
from aleph.index.util import field_filter_query, authz_query


# Some inspiration:
#
# https://github.com/nchah/freebase-mql#mql-and-graphql
# https://rdflib.readthedocs.io/en/stable/intro_to_graphs.html#basic-triple-matching

# Queries:
# * Node inbound degree query
# * Entity inbound (degree) query


class GraphQuery(object):

    def __init__(self, graph, authz=None):
        self.graph = graph
        self.authz = authz
        self.clauses = []

    @property
    def filter(self):
        if self.authz:
            return authz_query(self.authz)

    def node(self, node, limit=0, count=None):
        clause = NodeQueryClause(self, node, limit, count)
        self.clauses.append(clause)
        return clause

    def edge(self, node, prop, limit=0, count=None):
        clause = EdgeQueryClause(self, node, prop, limit, count)
        self.clauses.append(clause)
        return clause

    def execute(self):
        pass

    def debug(self):
        pprint({
            # 'graph': self.graph.to_dict(),
            'clauses': [c.to_dict() for c in self.clauses]
        })


class QueryClause(object):

    def __init__(self, query, node, prop=None, limit=0, count=None):
        self.query = query
        self.node = node
        self.prop = prop
        self.limit = limit
        self.count = count
        query.graph.add(node.proxy)

    @property
    def index(self):
        """The index affected by this query."""
        return entities_read_index(self.schemata)

    @property
    def counters(self):
        if self.count:
            return self.filter

    def query_id(self):
        return hash_data((self.index, self.filter))

    def to_dict(self):
        return {
            'id': self.id,
            # 'node': self.node.to_dict() if self.node else None,
            # 'prop': self.prop.qname if self.prop else None,
            'filter': self.filter,
            'index': self.index
        }


class NodeQueryClause(QueryClause):

    def __init__(self, query, node, limit=0, count=False):
        super(NodeQueryClause, self).__init__(query, node,
                                              limit=limit,
                                              count=count)
        self.schemata = model.get_type_schemata(self.node.type)
        self.filter = field_filter_query(node.type.group, node.value)
        self.id = node.id


class EdgeQueryClause(QueryClause):

    def __init__(self, query, node, prop, limit=0, count=False):
        super(EdgeQueryClause, self).__init__(query, node,
                                              prop=prop,
                                              limit=limit,
                                              count=count)
        self.schemata = prop.schema
        field = 'properties.%s' % prop.name
        self.filter = field_filter_query(field, node.value)
        self.id = prop.qname


def demo():
    proxy = model.get_proxy({
        'id': 'banana',
        'schema': 'Person',
        'properties': {
            'name': ['John Doe'],
            'phone': ['+4923239271777'],
            'email': ['john@the-does.com']
        }
    })

    # UC 1: Tags query
    query = GraphQuery(Graph(edge_types=registry.matchable))
    for prop, value in proxy.itervalues():
        if prop.type.group is None:
            continue
        node = Node(prop.type, value)
        # TODO: consider specificity?
        query.node(node, count=True)
    query.debug()

    # UC 2: References query
    query = GraphQuery(Graph(edge_types=registry.matchable))
    for prop in proxy.schema.properties.values():
        if not prop.stub:
            continue
        node = Node(registry.entity, proxy.id, proxy=proxy)
        query.edge(node, prop.reverse, count=True)
    query.debug()

    # UC 3: Expand query
    graph = Graph(edge_types=registry.matchable)
    query = GraphQuery(graph)
    for prop in proxy.schema.properties.values():
        if not prop.stub:
            continue
        node = Node(registry.entity, proxy.id, proxy=proxy)
        query.edge(node, prop.reverse, limit=200, count=True)
    query.debug()


if __name__ == '__main__':
    demo()
