from aleph.tests.util import TestCase


class GraphApiTestCase(TestCase):

    def setUp(self):
        super(GraphApiTestCase, self).setUp()
        self.load_fixtures('docs.yaml')

    # def test_simplest_graph(self):
    #     self.login(is_admin=True)
    #     res = self.client.get('/api/1/graph')
    #     assert res.status_code == 200, res
    #     assert 'nodes' in res.json, res.json
    #     assert len(res.json['nodes']) == 2, res.json
    #     assert len(res.json['links']) == 1, res.json

    # def test_simplest_graph_gexf(self):
    #     self.login(is_admin=True)
    #     res = self.client.get('/api/1/graph?format=gexf')
    #     assert res.status_code == 200, res
    #     assert 'xml' in res.content_type, res
    #     assert 'KwaZulu' in res.data
