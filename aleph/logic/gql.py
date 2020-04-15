import logging
# from banal import hash_data
from pprint import pprint  # noqa
from followthemoney import model
from followthemoney.types import registry
from followthemoney.graph import Graph, Node

from aleph.core import es
from aleph.index.entities import _source_spec, PROXY_INCLUDES
from aleph.index.indexes import entities_read_index
from aleph.index.util import field_filter_query, authz_query, unpack_result

log = logging.getLogger(__name__)

# https://github.com/nchah/freebase-mql#mql-and-graphql
# https://rdflib.readthedocs.io/en/stable/intro_to_graphs.html#basic-triple-matching


class GraphQuery(object):

    def __init__(self, graph, authz=None):
        self.graph = graph
        self.authz = authz
        self.clauses = []

    @property
    def filter(self):
        if self.authz:
            return authz_query(self.authz)

    def node(self, node, limit=0, count=False):
        clause = QueryClause(self, node, None, limit, count)
        self.clauses.append(clause)

    def edge(self, node, prop, limit=0, count=False):
        clause = QueryClause(self, node, prop, limit, count)
        self.clauses.append(clause)

    def _group_clauses(self):
        "Group clauses into buckets representing one ES query each."
        grouped = {}
        for clause in self.clauses:
            group = clause.index
            if clause.limit > 0:
                group = (clause.index, clause.id)
            grouped.setdefault(group, [])
            grouped[group].append(clause)
        return grouped.values()

    def compile(self):
        "Generate a sequence of ES queries representing the clauses."
        queries = []
        for clauses in self._group_clauses():
            query = {'filter': []}
            if self.filter:
                query['filter'].append(self.filter)
            if len(clauses) == 1:
                query['filter'].append(clauses[0].filter)
            else:
                query['minimum_should_match'] = 1
                query['should'] = []
                for clause in clauses:
                    query['should'].append(clause.filter)

            query = {
                'size': clauses[0].limit,
                'query': {'bool': query},
                '_source': _source_spec(PROXY_INCLUDES, None)
            }
            counters = {}
            for clause in clauses:
                if clause.count:
                    counters[clause.id] = clause.filter
            if len(counters):
                query['aggs'] = {
                    'counters': {'filters': {'filters': counters}}
                }
            index = clauses[0].index
            queries.append((clauses, index, query))
        return queries

    def execute(self):
        "Run queries and dingle apart the returned responses."
        queries = self.compile()
        if not len(queries):
            return []
        body = []
        for (_, index, query) in queries:
            body.append({'index': index})
            body.append(query)
        results = es.msearch(body=body)
        responses = results.get('responses', [])
        for ((clauses, _, _), result) in zip(queries, responses):
            hits = result.get('hits', {}).get('hits', [])
            results = [unpack_result(r) for r in hits]
            aggs = result.get('aggregations', {}).get('counters', {})
            counters = aggs.get('buckets', {})
            for clause in clauses:
                count = counters.get(clause.id, {}).get('doc_count')
                clause.apply(count, results)
        return self.clauses


class QueryClause(object):

    def __init__(self, query, node, prop=None, limit=0, count=False):
        self.graph = query.graph
        self.graph.add(node.proxy)
        self.node = node
        self.id = node.id
        self.limit = limit or 0
        self.count = count
        self.entities = []
        self.prop = prop
        if prop is not None:
            self.index = entities_read_index(prop.schema)
            field = 'properties.%s' % prop.name
            self.filter = field_filter_query(field, node.value)
            self.id = prop.qname
        else:
            schemata = model.get_type_schemata(self.node.type)
            self.index = entities_read_index(schemata)
            self.filter = field_filter_query(node.type.group, node.value)

    def apply(self, count, results):
        self.count = count
        for result in results:
            proxy = model.get_proxy(result)
            self.entities.append(proxy)
            self.graph.add(proxy)


def demo():
    proxy = model.get_proxy({
        'id': 'banana',
        'schema': 'Person',
        'properties': {
            'name': ['John Doe', 'Donna Harding'],
            'phone': ['+4923239271777'],
            'email': ['john@the-does.com']
        }
    })
    graph = Graph(edge_types=registry.matchable)

    # UC 1: Tags query
    query = GraphQuery(graph)
    for prop, value in proxy.itervalues():
        if prop.type.group is None:
            continue
        node = Node(prop.type, value)
        # TODO: consider specificity?
        query.node(node, count=True)
    for res in query.execute():
        print(res.node.value, res.count)

    # UC 2: References query
    query = GraphQuery(graph)
    for prop in proxy.schema.properties.values():
        if not prop.stub:
            continue
        node = Node(registry.entity, proxy.id, proxy=proxy)
        query.edge(node, prop.reverse, count=True)
    for res in query.execute():
        print(res.prop, res.prop.schema, res.count)

    # UC 3: Expand query
    query = GraphQuery(graph)
    for prop in proxy.schema.properties.values():
        if not prop.stub:
            continue
        node = Node(registry.entity, proxy.id, proxy=proxy)
        query.edge(node, prop.reverse, limit=200, count=False)
    query.execute()
    graph.resolve()


if __name__ == '__main__':
    demo()
