import json
from aleph.tests.util import TestCase


class ReconcileApiTestCase(TestCase):

    def setUp(self):
        super(ReconcileApiTestCase, self).setUp()

    def test_index(self):
        res = self.client.get('/api/freebase/reconcile')
        assert res.status_code == 200, res
        assert 'schemaSpace' in res.json, res.json

    def test_recon(self):
        self.load_fixtures('docs.yaml')
        res = self.client.get('/api/freebase/reconcile?query=kwazulu')
        assert res.json['num'] == 1, res
        assert res.json['result'][0]['name'] == 'KwaZulu', res.json

        data = json.dumps({'query': 'KWazulu'})
        res = self.client.get('/api/freebase/reconcile?query=%s' % data)
        assert res.json['num'] == 1, res
        assert res.json['result'][0]['name'] == 'KwaZulu', res.json

    def test_suggest(self):
        self.load_fixtures('docs.yaml')
        res = self.client.get('/api/freebase/suggest')
        assert res.status_code == 200, res
        assert 'result' in res.json, res.json
        assert not len(res.json['result']), res.json

        res = self.client.get('/api/freebase/suggest?prefix=kwa')
        assert res.status_code == 200, res
        assert 1 == len(res.json['result']), res.json

        res = self.client.get('/api/freebase/suggest?prefix=kwa&type=Person')
        assert res.status_code == 200, res
        assert 0 == len(res.json['result']), res.json

        res = self.client.get('/api/freebase/suggest?prefix=kwa&type=Company')
        assert res.status_code == 200, res
        assert 1 == len(res.json['result']), res.json

    def test_property(self):
        res = self.client.get('/api/freebase/property')
        assert res.status_code == 200, res
        assert 'result' in res.json, res.json
        assert 5 == len(res.json['result']), res.json

        res = self.client.get('/api/freebase/property?prefix=email')
        assert 1 == len(res.json['result']), res.json

        res = self.client.get('/api/freebase/property?prefix=banana')
        assert 0 == len(res.json['result']), res.json

    def test_type(self):
        res = self.client.get('/api/freebase/type')
        assert res.status_code == 200, res
        assert len(res.json['result']) > 3, res.json

        res = self.client.get('/api/freebase/property?prefix=Compa')
        assert 1 == len(res.json['result']), res.json

        res = self.client.get('/api/freebase/property?prefix=Banana')
        assert 0 == len(res.json['result']), res.json
