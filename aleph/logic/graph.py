import logging
from collections import defaultdict

from banal import ensure_list
from followthemoney import model
from followthemoney.graph import Graph
from followthemoney.types import registry

from aleph.core import es
from aleph.model import Entity
from aleph.logic import resolver
from aleph.index.util import unpack_result
from aleph.index.util import authz_query, field_filter_query


log = logging.getLogger(__name__)

MAX_EXPAND_NODES_PER_PROPERTY = 20


class AlephGraph(Graph):
    def queue(self, id_, proxy=None):
        if id_ not in self.proxies:
            self.proxies[id_] = proxy
            resolver.queue(self, Entity, id_)

    def resolve(self):
        resolver.resolve(self)
        for id_, proxy in self.proxies.items():
            if proxy is None:
                entity = resolver.get(self, Entity, id_)
                proxy = model.get_proxy(entity)
            node_id = registry.entity.node_id_safe(id_)
            node = self.nodes.get(node_id)
            if node is not None:
                node.proxy = proxy
                if node.schema is None:
                    node.schema = proxy.schema

    def get_adjacent_entities(self, proxy):
        source_node_id = registry.entity.node_id_safe(proxy.id)
        adjacents = defaultdict(list)
        exapnded_prop_nodes = []
        for edge in self.edges.values():
            if edge.source_id == source_node_id:
                if edge.target.is_entity:
                    adjacents[edge.type_name].append(edge.target.proxy)
                else:
                    exapnded_prop_nodes.append(edge.target_id)
            if edge.target_id == source_node_id:
                if edge.source.is_entity:
                    adjacents[edge.type_name].append(edge.source.proxy)
        for edge in self.edges.values():
            if (edge.target_id in exapnded_prop_nodes
                    and edge.source_id != source_node_id):
                adjacents[edge.type_name].append(edge.source.proxy)
        return adjacents

    def to_dict(self):
        return {
            'nodes': self.nodes.values(),
            'edges': self.edges.values()
        }


class GraphSegmentResponse(object):
    """Store ES graph query results - property wise adjacent entities and
    counts"""
    def __init__(self):
        self.entities = dict()
        self.counts = dict()

    def set_entities(self, qname, entities):
        self.entities[qname] = ensure_list(entities)

    def set_count(self, qname, count):
        self.counts[qname] = count

    def get_count(self, qname):
        return self.counts.get(qname) or 0

    @property
    def total_count(self):
        return sum(self.count(qname) for qname in self.entities)

    def iter_prop_counts(self):
        return self.iter_props(include_entities=False)

    def iter_props(self, include_entities=True):
        for qname, count in self.counts.items():
            if count > 0:
                if include_entities:
                    yield (model.get_qname(qname), count, self.entities.get(qname, []))  # noqa
                else:
                    yield (model.get_qname(qname), count)

    def reverse_property(self, qnames):
        """Use the reverse property qname for certain properties"""
        for qname in qnames:
            prop = model.get_qname(qname)
            reversed_prop = prop.reverse
            entities = self.entities.pop(qname, None)
            if entities is not None:
                self.set_entities(reversed_prop.qname, entities)
            count = self.counts.pop(qname, None)
            if count is not None:
                self.set_count(reversed_prop.qname, count)

    def ignore_source(self, qnames, entity_id):
        """Ignore counting the source entity itself for certain properties"""
        for qname in qnames:
            count = self.get_count(qname)
            entities = self.entities.pop(qname, None)
            if entities:
                entities = [ent for ent in entities if ent['id'] != entity_id]
                if entities:
                    self.set_entities(qname, entities)
                else:
                    self.entities.pop(qname, None)
            if count > 0:
                count = count - 1
                if count == 0:
                    self.counts.pop(qname, None)
                else:
                    self.set_count(qname, count)


class GraphSegmentQuery(object):
    """Query ES for property wise list of adjacent entities"""
    def __init__(self, response=None):
        self.facets = []
        self.response = response or GraphSegmentResponse()

    def add_facet(self, facet):
        self.facets.append(facet)

    def query(self, collection_ids=None, authz=None, include_entities=False):
        filters = {}
        indexed = {}
        for (idx, alias, group, field, value) in self.facets:
            indexed[idx] = indexed.get(idx, {})
            indexed[idx][alias] = field_filter_query(field, value)
            filters[idx] = filters.get(idx, {})
            filters[idx][group] = filters[idx].get(group, [])
            filters[idx][group].append(value)

        queries = []
        for (idx, facets) in indexed.items():
            shoulds = []
            for field, values in filters[idx].items():
                shoulds.append(field_filter_query(field, values))
            query = []
            if authz is not None:
                query.append(authz_query(authz))
            if collection_ids:
                query.append(field_filter_query('collection_id', collection_ids))  # noqa
            query = {
                'bool': {
                    'should': shoulds,
                    'filter': query,
                    'minimum_should_match': 1
                }
            }
            for (k, v) in facets.items():
                queries.append({'index': idx})
                aggs = {'counters': {'filters': {'filters': {k: v}}}}
                queries.append({
                    'size': MAX_EXPAND_NODES_PER_PROPERTY if include_entities else 0,  # noqa
                    'query': query,
                    'aggs': aggs
                })

        res = es.msearch(body=queries)

        for resp in res.get('responses', []):
            aggs = resp.get('aggregations', {}).get('counters', {})
            for alias, value in aggs.get('buckets', {}).items():
                count = value.get('doc_count', self.response.get_count(alias))
                if count > 0:
                    self.response.set_count(alias, count)
                    if include_entities:
                        entities = []
                        hits = resp.get('hits', {}).get('hits', [])
                        for doc in hits:
                            entity = unpack_result(doc)
                            if entity is not None:
                                entities.append(entity)
                        self.response.set_entities(alias, entities)
        return self.response
