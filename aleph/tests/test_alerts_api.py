import json

from aleph.core import db
from aleph.model import Alert
from aleph.tests.util import TestCase


class AlertsApiTestCase(TestCase):

    def setUp(self):
        super(AlertsApiTestCase, self).setUp()

    def test_index(self):
        res = self.client.get('/api/2/alerts')
        assert res.status_code == 403, res
        _, headers = self.login()
        res = self.client.get('/api/2/alerts',
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json.get('total') == 0, res.json

    def test_create(self):
        data = {'query_text': 'banana pumpkin'}
        jdata = json.dumps(data)
        res = self.client.post('/api/2/alerts',
                               data=jdata,
                               content_type='application/json')
        assert res.status_code == 403, res
        _, headers = self.login()
        res = self.client.post('/api/2/alerts',
                               data=jdata,
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert 'banana pumpkin' in res.json['label'], res.json

    def test_create_with_label(self):
        data = {'query_text': 'foo', 'label': 'banana'}
        jdata = json.dumps(data)
        _, headers = self.login()
        res = self.client.post('/api/2/alerts',
                               data=jdata,
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert 'banana' in res.json['label'], res.json

    def test_create_with_query(self):
        data = {'query_text': 'putin'}
        jdata = json.dumps(data)
        _, headers = self.login()
        res = self.client.post('/api/2/alerts',
                               data=jdata,
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert 'putin' in res.json['label'], res.json
        assert res.json['query_text'] == 'putin', res.json

    def test_view(self):
        data = {'query_text': 'putin'}
        jdata = json.dumps(data)
        _, headers = self.login()
        res = self.client.post('/api/2/alerts',
                               data=jdata,
                               headers=headers,
                               content_type='application/json')
        url = '/api/2/alerts/%s' % res.json['id']
        res2 = self.client.get(url,
                               headers=headers)
        assert res2.json['id'] == res.json['id'], res2.json

        res3 = self.client.get('/api/2/alerts/100000',
                               headers=headers)
        assert res3.status_code == 404, res3

    def test_delete(self):
        data = {'query_text': 'putin'}
        jdata = json.dumps(data)
        _, headers = self.login()
        res = self.client.post('/api/2/alerts',
                               data=jdata,
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, res.status_code

        count = Alert.all().count()
        url = '/api/2/alerts/%s' % res.json['id']
        res = self.client.delete(url, headers=headers)
        assert res.status_code == 204, res.json
        new_count = Alert.all().count()
        real_count = db.session.query(Alert).count()
        assert count == real_count, (count, real_count)
        assert new_count == real_count - 1
