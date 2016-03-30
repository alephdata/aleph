from aleph.tests.util import TestCase


class ExportApiTestCase(TestCase):

    def setUp(self):
        super(ExportApiTestCase, self).setUp()
        self.load_fixtures('docs.yaml')

    def test_smoke_comes_out(self):
        self.login(is_admin=True)
        res = self.client.get('/api/1/query/export')
        assert res.status_code == 200, res
        assert 'openxmlformats' in res.content_type, res.content_type
