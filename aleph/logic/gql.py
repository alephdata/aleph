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
        self.patterns = []

    @property
    def filters(self):
        filters = []
        if self.authz:
            filters.append(authz_query(self.authz))
        return filters

    def node(self, node, limit=0, count=False):
        pattern = QueryPattern(self, node, None, limit, count)
        self.patterns.append(pattern)

    def edge(self, node, prop, limit=0, count=False):
        pattern = QueryPattern(self, node, prop, limit, count)
        self.patterns.append(pattern)

    def _group_patterns(self):
        "Group patterns into buckets representing one ES query each."
        grouped = {}
        for pattern in self.patterns:
            group = pattern.index
            if pattern.limit > 0:
                group = (pattern.index, pattern.id)
            grouped.setdefault(group, [])
            grouped[group].append(pattern)
        return grouped.values()

    def compile(self):
        "Generate a sequence of ES queries representing the patterns."
        queries = []
        for patterns in self._group_patterns():
            query = {'filter': self.filters}
            if len(patterns) == 1:
                query['filter'].append(patterns[0].filter)
            else:
                query['minimum_should_match'] = 1
                query['should'] = []
                for pattern in patterns:
                    query['should'].append(pattern.filter)

            query = {
                'size': patterns[0].limit,
                'query': {'bool': query},
                '_source': _source_spec(PROXY_INCLUDES, None)
            }
            counters = {}
            for pattern in patterns:
                if pattern.count:
                    counters[pattern.id] = pattern.filter
            if len(counters):
                query['aggs'] = {
                    'counters': {'filters': {'filters': counters}}
                }
            index = patterns[0].index
            queries.append((patterns, index, query))
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
        for ((patterns, _, _), result) in zip(queries, responses):
            hits = result.get('hits', {}).get('hits', [])
            results = [unpack_result(r) for r in hits]
            aggs = result.get('aggregations', {}).get('counters', {})
            counters = aggs.get('buckets', {})
            for pattern in patterns:
                count = counters.get(pattern.id, {}).get('doc_count')
                pattern.apply(count, results)
        return self.patterns


class QueryPattern(object):

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
    proxy_node = Node.from_proxy(proxy)

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
        query.edge(proxy_node, prop.reverse, count=True)
    for res in query.execute():
        print(res.prop, res.prop.schema, res.count)

    # UC 3: Expand query
    query = GraphQuery(graph)
    for prop in proxy.schema.properties.values():
        if not prop.stub:
            continue
        query.edge(proxy_node, prop.reverse, limit=200, count=True)
    query.execute()
    graph.resolve()


if __name__ == '__main__':
    demo()
