from aleph.index import flush_index
from aleph.logic import delete_collection
from aleph.model import Collection
from aleph.tests.util import TestCase


class IndexTestCase(TestCase):

    def setUp(self):
        super(IndexTestCase, self).setUp()
        self.load_fixtures('docs.yaml')

    def test_delete_source(self):
        collection = Collection.by_id(1000)
        res = self.client.get('/api/1/query?q="mention fruit"')
        assert res.json['total'] == 1, res.json
        delete_collection(collection.id)
        flush_index()
        res = self.client.get('/api/1/query?q="mention fruit"')
        assert res.json['total'] == 0, res.json
