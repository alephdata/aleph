import logging

from aleph import authz
from aleph.graph.schema import NodeType, EdgeType

log = logging.getLogger(__name__)


class GraphQuery(object):

    def __init__(self, graph, data):
        self.graph = graph
        self.data = data

    @property
    def limit(self):
        try:
            return min(int(self.data.get('limit', 15)), 5000)
        except:
            return 15

    @property
    def offset(self):
        try:
            return max(int(self.data.get('offset', 0)), 0)
        except:
            return 0

    def ignore(self):
        return self.data.getlist('ignore')

    def _as_json(self, results):
        """Helper to make query responses more uniform."""
        return {
            'status': 'ok',
            'limit': self.limit,
            'offset': self.offset,
            'results': results
        }

    def to_dict(self):
        return self._as_json(self.execute())


class NodeQuery(GraphQuery):

    def text(self):
        text = self.data.get('text')
        if text is not None:
            text = unicode(text).strip()
            if len(text) < 1:
                text = None
            else:
                text = '(?i).*%s.*' % text
        return text

    def collection_id(self):
        acl = authz.collections(authz.READ)
        collections = []
        for coll in self.data.getlist('collection_id'):
            coll = int(coll)
            if coll in acl:
                collections.append(coll)
        return collections or acl

    def query(self):
        args = {
            'acl': authz.collections(authz.READ),
            'limit': self.limit,
            'offset': self.offset,
            'text': self.text(),
            'ignore': self.ignore(),
            'collection_id': self.collection_id()
        }
        filters = []
        filters.append('ncoll.alephCollection IN {collection_id}')
        filters.append('ocoll.alephCollection IN {acl}')
        if args['text'] is not None:
            filters.append('node.name =~ {text}')
        if len(args['ignore']):
            filters.append('NOT (node.id IN {ignore})')

        q = "MATCH (node)-[:PART_OF]->(ncoll:Collection) " \
            "MATCH (node)-[r]-(other) " \
            "MATCH (other)-[:PART_OF]->(ocoll:Collection) " \
            "WHERE %s " \
            "WITH node, count(r) AS degree " \
            "ORDER BY degree DESC " \
            "SKIP {offset} LIMIT {limit} " \
            "RETURN node, degree "
        q = q % ' AND '.join(filters)
        # print args, q
        return q, args

    def execute(self):
        query, args = self.query()
        nodes = []
        for row in self.graph.run(query, **args):
            node = NodeType.dict(row.get('node'))
            node['$degree'] = row.get('degree')
            nodes.append(node)
        return nodes


class EdgeQuery(GraphQuery):

    def collection_id(self):
        acl = authz.collections(authz.READ)
        collections = []
        for coll in self.data.getlist('collection_id'):
            coll = int(coll)
            if coll in acl:
                collections.append(coll)
        return collections or acl

    def query(self):
        args = {
            'acl': authz.collections(authz.READ),
            'limit': self.limit,
            'offset': self.offset,
            'ignore': self.ignore(),
            'collection_id': self.collection_id()
        }
        filters = []
        filters.append('sourcecoll.alephCollection IN {collection_id}')
        filters.append('targetcoll.alephCollection IN {collection_id}')
        if len(args['ignore']):
            filters.append('NOT (rel.id IN {ignore})')

        q = "MATCH (source)-[rel]-(target) " \
            "MATCH (source)-[:PART_OF]->(sourcecoll:Collection) " \
            "MATCH (target)-[:PART_OF]->(targetcoll:Collection) " \
            "WHERE %s " \
            "RETURN source.id AS source, rel, target.id AS target " \
            "SKIP {offset} LIMIT {limit} "
        q = q % ' AND '.join(filters)
        return q, args

    def execute(self):
        query, args = self.query()
        edges = []
        for row in self.graph.run(query, **args):
            data = EdgeType.dict(row.get('rel'))
            data['$source'] = row.get('source')
            data['$target'] = row.get('target')
            edges.append(data)
        return edges
