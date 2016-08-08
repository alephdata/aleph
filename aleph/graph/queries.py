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

    def _bool(self, name, default=False):
        """Fetch a query argument, as a boolean."""
        v = unicode(self.data.get(name, '')).strip().lower()
        if not len(v):
            return default
        return v in ['true', '1', 'yes', 'y', 't']

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
        collection_id = self.data.getlist('collection_id')
        return authz.collections_intersect(authz.READ, collection_id)

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

    def source_collection_id(self):
        collection_id = self.data.getlist('source_collection_id')
        if not len(collection_id):
            collection_id = self.data.getlist('collection_id')
        return authz.collections_intersect(authz.READ, collection_id)

    def target_collection_id(self):
        collection_id = self.data.getlist('target_collection_id')
        if not len(collection_id):
            collection_id = self.data.getlist('collection_id')
        return authz.collections_intersect(authz.READ, collection_id)

    def source_id(self):
        node_id = self.data.getlist('source_id')
        if not len(node_id):
            node_id = self.data.getlist('node_id')
        return node_id

    def target_id(self):
        node_id = self.data.getlist('target_id')
        if not len(node_id):
            node_id = self.data.getlist('node_id')
        return node_id

    def query(self):
        args = {
            'acl': authz.collections(authz.READ),
            'limit': self.limit,
            'offset': self.offset,
            'ignore': self.ignore(),
            'source_collection_id': self.source_collection_id(),
            'target_collection_id': self.target_collection_id(),
            'source_id': self.source_id(),
            'target_id': self.target_id()
        }
        directed = '>' if self._bool('directed') else ''
        filters = []
        filters.append('sourcecoll.alephCollection IN {source_collection_id}')
        filters.append('targetcoll.alephCollection IN {target_collection_id}')
        if len(args['ignore']):
            filters.append('NOT (rel.id IN {ignore})')
        if len(args['source_id']):
            filters.append('source.id IN {source_id}')
        if len(args['target_id']):
            filters.append('target.id IN {target_id}')

        q = "MATCH (source)-[rel]-%s(target) " \
            "MATCH (source)-[:PART_OF]->(sourcecoll:Collection) " \
            "MATCH (target)-[:PART_OF]->(targetcoll:Collection) " \
            "WHERE %s " \
            "RETURN source.id AS source, rel, target.id AS target " \
            "SKIP {offset} LIMIT {limit} "
        filters = ' AND '.join(filters)
        q = q % (directed, filters)
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
