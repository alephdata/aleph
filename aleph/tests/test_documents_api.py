import json

from aleph.tests.util import TestCase


class DocumentsApiTestCase(TestCase):

    def setUp(self):
        super(DocumentsApiTestCase, self).setUp()
        self.load_fixtures('docs.yaml')

    def test_index(self):
        res = self.client.get('/api/2/documents')
        assert res.status_code == 200, res

        _, headers = self.login(is_admin=True)
        res = self.client.get('/api/2/documents', headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 4, res.json

        fix = '720badc9cfa9a80fc455239f86c56273dc5c8291'
        res = self.client.get('/api/2/documents?filter:content_hash=%s' % fix,
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        assert res.json['results'][0]['content_hash'] == fix, res.json

    def test_view(self):
        doc_id = 1000
        res = self.client.get('/api/2/documents/%s' % doc_id)
        assert res.status_code == 200, res
        assert res.json['foreign_id'] == 'test1', res

        res = self.client.get('/api/2/documents/328984')
        assert res.status_code == 404, res

    def test_view_records(self):
        res = self.client.get('/api/2/documents/1003/records')
        assert res.status_code == 200, res
        assert 'results' in res.json, res.json
        assert len(res.json['results']) == 10, res.json

    def test_view_record_by_id(self):
        doc_id = 1000
        res = self.client.get('/api/2/documents/%s/records/1' % doc_id)
        assert res.status_code == 200, res
        assert 'banana' in res.json['text'], res
        assert 'total' not in res.json['text'], res
        res = self.client.get('/api/2/documents/%s/records/2' % doc_id)
        assert 'total' in res.json['text'], res
        res = self.client.get('/api/2/documents/%s/records/2000' % doc_id)
        assert res.status_code == 404, res

    def test_records_search(self):
        res = self.client.get('/api/2/documents/1003/records?q=kwazulu')
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json

    def test_view_pdf(self):
        res = self.client.get('/api/2/documents/1003/pdf')
        assert res.status_code == 400, res
        res = self.client.get('/api/2/documents/1000/pdf')
        assert res.status_code == 404, res

    def test_update_simple(self):
        url = '/api/2/documents/1000'
        res = self.client.get(url)
        assert res.status_code == 200, res

        data = res.json
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 403, res.json

        data['title'] = 'Eaten by a pumpkin'
        _, headers = self.login(is_admin=True)
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert res.json['title'] == data['title'], res.json

    def test_update_invalid(self):
        url = '/api/2/documents/1000'
        ores = self.client.get(url)
        _, headers = self.login(is_admin=True)

        data = ores.json.copy()
        data['published_at'] = 'yesterday'
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 400, res.json

        data = ores.json.copy()
        data['countries'] = ['xz']
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 400, res.json

        data = ores.json.copy()
        data['keywords'] = ['']
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 400, res.json

    def test_delete(self):
        res = self.client.get('/api/2/documents/1003')
        assert res.status_code == 200, res
        res = self.client.delete('/api/2/documents/1003')
        assert res.status_code == 403, res
        _, headers = self.login(is_admin=True)
        res = self.client.delete('/api/2/documents/1003',
                                 headers=headers)
        assert res.status_code == 204, res
        res = self.client.get('/api/2/documents/1003',
                              headers=headers)
        assert res.status_code == 404, res
