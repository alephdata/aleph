from aleph.model import Collection
from aleph.logic.collections import delete_collection
from aleph.tests.util import TestCase


class IndexTestCase(TestCase):

    def setUp(self):
        super(IndexTestCase, self).setUp()
        self.load_fixtures('docs.yaml')

    def test_delete_collection(self):
        collection = Collection.by_id(1000)
        res = self.client.get('/api/2/search?q="mention fruit"')
        assert res.json['total'] == 1, res.json
        delete_collection(collection)
        res = self.client.get('/api/2/search?q="mention fruit"')
        assert res.json['total'] == 0, res.json
