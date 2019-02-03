from aleph.tests.util import TestCase


class DocumentsApiTestCase(TestCase):

    def setUp(self):
        super(DocumentsApiTestCase, self).setUp()
        self.load_fixtures('docs.yaml')

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
