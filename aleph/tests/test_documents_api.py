
from aleph.core import db
from aleph.model import Document
from aleph.tests.util import TestCase


class DocumentsApiTestCase(TestCase):

    def setUp(self):
        super(DocumentsApiTestCase, self).setUp()
        self.load_fixtures('docs.yaml')

    def test_index(self):
        res = self.client.get('/api/1/documents')
        assert res.status_code == 200, res

        self.login(is_admin=True)
        res = self.client.get('/api/1/documents')
        assert res.status_code == 200, res
        assert res.json['total'] == 4, res.json

        fix = '720badc9cfa9a80fc455239f86c56273dc5c8291'
        res = self.client.get('/api/1/documents?content_hash=%s' % fix)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        assert res.json['results'][0]['content_hash'] == fix, res.json

    def test_view(self):
        doc_id = 1000
        res = self.client.get('/api/1/documents/%s' % doc_id)
        assert res.status_code == 200, res
        assert res.json['foreign_id'] == 'test1', res

        res = self.client.get('/api/1/documents/328984')
        assert res.status_code == 404, res

    def test_view_pages(self):
        doc_id = 1000
        res = self.client.get('/api/1/documents/%s/pages/1' % doc_id)
        assert res.status_code == 200, res
        assert 'banana' in res.json['text'], res
        assert 'total' not in res.json['text'], res
        res = self.client.get('/api/1/documents/%s/pages/2' % doc_id)
        assert 'total' in res.json['text'], res
        res = self.client.get('/api/1/documents/%s/pages/2000' % doc_id)
        assert res.status_code == 404, res

    def test_view_tables(self):
        doc_id = 1003
        res = self.client.get('/api/1/documents/%s/tables/0' % doc_id)
        assert res.status_code == 200, res
        assert 'sheet_name' in res.json, res.json

        res = self.client.get('/api/1/documents/%s/tables/444' % doc_id)
        assert res.status_code == 404, res

    def test_view_table_rows(self):
        doc_id = 1003
        res = self.client.get('/api/1/documents/%s/tables/0/rows' % doc_id)
        assert res.status_code == 200, res
        assert 'results' in res.json, res.json
        assert len(res.json['results']) == 10, res.json
