from aleph.index import delete_source, optimize_search
from aleph.model import Source
from aleph.tests.util import TestCase


class IndexTestCase(TestCase):

    def setUp(self):
        super(IndexTestCase, self).setUp()
        self.load_fixtures('docs.yaml')

    def test_delete_source(self):
        source = Source.by_id(1000)
        res = self.client.get('/api/1/query?q="mention fruit"')
        assert res.json['total'] == 1, res.json
        delete_source(source.id)
        optimize_search()
        res = self.client.get('/api/1/query?q="mention fruit"')
        assert res.json['total'] == 0, res.json
