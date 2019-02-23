from aleph.tests.util import TestCase


class DocumentsApiTestCase(TestCase):

    def setUp(self):
        super(DocumentsApiTestCase, self).setUp()
        self.load_fixtures('docs.yaml')

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
