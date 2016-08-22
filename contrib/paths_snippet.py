

class PathQuery(GraphQuery):
    # WARNING: this version of the path code only checks if the
    # first and last node are visible to the user. Checking for
    # each item in the path would be correct but made the query
    # explode.

    def start_collection_id(self):
        collection_id = self.data.getlist('start_collection_id')
        return authz.collections_intersect(authz.READ, collection_id)

    def end_collection_id(self):
        collection_id = self.data.getlist('end_collection_id')
        return authz.collections_intersect(authz.READ, collection_id)

    def start_id(self):
        return self.data.getlist('start_node_id')

    def get_filters(self):
        args = {
            'limit': self.limit,
            'offset': self.offset,
            'start_node_id': self.start_id(),
            'start_collection_id': self.start_collection_id(),
            'end_collection_id': self.end_collection_id()
        }
        filters = []
        filters.append('startcoll.alephCollection IN {start_collection_id}')
        filters.append('endcoll.alephCollection IN {end_collection_id}')
        filters.append('startcoll <> endcoll')
        # filters.append('NOT ()-[:AKA]->(start)')
        # filters.append('NOT ()-[:AKA]->(end)')
        filters.append('all(r IN relationships(pth) WHERE type(r) <> "PART_OF")')
        return args, filters

    def query(self):
        args, filters = self.get_filters()
        q = "MATCH pth = shortestPath((start:Entity)-[*1..3]-(end:Entity)) " \
            "MATCH (start:Entity)-[:PART_OF]->(startcoll:Collection) " \
            "MATCH (end:Entity)-[:PART_OF]->(endcoll:Collection) " \
            "WHERE %s " \
            "RETURN DISTINCT pth, endcoll SKIP {offset} LIMIT {limit} "
        q = q % ' AND '.join(filters)
        # print q, args
        return q, args

    def collections_query(self):
        args, filters = self.get_filters()
        args['end_collection_id'] = authz.collections(authz.READ)
        q = "MATCH pth = shortestPath((start:Entity)-[*1..3]-(end:Entity)) " \
            "MATCH (start:Entity)-[:PART_OF]->(startcoll:Collection) " \
            "MATCH (end:Entity)-[:PART_OF]->(endcoll:Collection) " \
            "WHERE %s " \
            "RETURN DISTINCT endcoll.alephCollection AS id, endcoll.name AS label LIMIT 15"
        q = q % ' AND '.join(filters)
        # print q, args
        return q, args

    def execute(self):
        query, args = self.query()
        paths = []
        for row in self.graph.run(query, **args):
            path = {
                'nodes': [],
                'edges': [],
                'collection': {
                    'id': row.get('endcoll').get('alephCollection'),
                    'label': row.get('endcoll').get('name')
                }
            }
            for node in row.get('pth').nodes():
                path['nodes'].append(NodeType.dict(node))
            for i, rel in enumerate(row.get('pth').relationships()):
                data = EdgeType.dict(rel)
                data['$source'] = rel.start_node().get('id')
                data['$target'] = rel.end_node().get('id')
                data['$inverted'] = data['$source'] != path['nodes'][i]['id']
                path['edges'].append(data)
            paths.append(path)
        collections = []
        query, args = self.collections_query()
        for row in self.graph.run(query, **args):
            collections.append(dict(row))
        return {'results': paths, 'collections': collections}




@blueprint.route('/api/1/graph/paths', methods=['GET'])
def get_paths():
    log_event(request)
    return jsonify(PathQuery(get_graph(), request.args))


@blueprint.route('/api/1/graph/paths', methods=['POST', 'PUT'])
def post_paths():
    log_event(request)
    return jsonify(PathQuery(get_graph(), get_post_multidict()))
