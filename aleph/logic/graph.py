import logging
from pprint import pprint  # noqa
from followthemoney import model
from followthemoney.types import registry
from followthemoney.graph import Graph as FtMGraph

from aleph.core import es
from aleph.model import Entity
from aleph.index.entities import _source_spec, PROXY_INCLUDES
from aleph.index.indexes import entities_read_index
from aleph.index.util import field_filter_query, authz_query, unpack_result

log = logging.getLogger(__name__)

# https://github.com/nchah/freebase-mql#mql-and-graphql
# https://rdflib.readthedocs.io/en/stable/intro_to_graphs.html#basic-triple-matching


class Graph(FtMGraph):
    """A subclass of `followthemoney.graph:Graph` that can resolve
    entities against the aleph search index and entity cache."""

    def resolve(self):
        from aleph.logic import resolver

        for id_ in self.queued:
            node_id = registry.entity.node_id_safe(id_)
            node = self.nodes.get(node_id)
            schema = None if node is None else node.schema
            resolver.queue(self, Entity, id_, schema=schema)
        resolver.resolve(self)
        for id_ in self.queued:
            entity = resolver.get(self, Entity, id_)
            if entity is not None:
                self.add(model.get_proxy(entity))

    def query(self, authz=None, collection_ids=None):
        return GraphQuery(self, authz=authz, collection_ids=collection_ids)


class GraphQuery(object):
    """A graph query bundles smaller query fragments (`QueryPattern`) into
    a larger request, groups them into an ES query and assigns the results
    to each pattern."""

    def __init__(self, graph, authz=None, collection_ids=None):
        self.graph = graph
        self.authz = authz
        self.patterns = []
        self.filters = []
        if authz is not None:
            self.filters.append(authz_query(authz))
        if collection_ids is not None:
            filter_ = field_filter_query("collection_id", collection_ids)
            self.filters.append(filter_)

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
            query = {"filter": list(self.filters)}
            if len(patterns) == 1:
                query["filter"].append(patterns[0].filter)
            else:
                query["minimum_should_match"] = 1
                query["should"] = []
                for pattern in patterns:
                    query["should"].append(pattern.filter)

            query = {
                "size": patterns[0].limit,
                "query": {"bool": query},
                "_source": _source_spec(PROXY_INCLUDES, None),
            }
            counters = {}
            for pattern in patterns:
                if pattern.count:
                    counters[pattern.id] = pattern.filter
            if len(counters):
                query["aggs"] = {"counters": {"filters": {"filters": counters}}}
            index = patterns[0].index
            queries.append((patterns, index, query))
        log.info(
            "GraphQuery has %d patterns, %s queries...",
            len(self.patterns),
            len(queries),
        )
        return queries

    def execute(self):
        "Run queries and dingle apart the returned responses."
        queries = self.compile()
        if not len(queries):
            return []
        body = []
        for (_, index, query) in queries:
            body.append({"index": index})
            body.append(query)
        results = es.msearch(body=body)
        responses = results.get("responses", [])
        for ((patterns, _, _), result) in zip(queries, responses):
            hits = result.get("hits", {}).get("hits", [])
            results = [unpack_result(r) for r in hits]
            aggs = result.get("aggregations", {}).get("counters", {})
            counters = aggs.get("buckets", {})
            for pattern in patterns:
                count = counters.get(pattern.id, {}).get("doc_count")
                pattern.apply(count, results)
        return self.patterns


class QueryPattern(object):
    """A fragment of a query that can either find a set of adjacent
    nodes or adjacent edges for the given core node."""

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
            field = "properties.%s" % prop.name
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
            proxy.context = {}
            self.entities.append(proxy)
            self.graph.add(proxy)
