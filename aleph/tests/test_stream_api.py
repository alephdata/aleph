from aleph.tests.util import TestCase


class StreamApiTestCase(TestCase):
    def setUp(self):
        super(StreamApiTestCase, self).setUp()

    def test_entities(self):
        self.load_fixtures()
        res = self.client.get("/api/2/entities/_stream")
        assert res.status_code == 403, res

        _, headers = self.login(is_admin=True)
        res = self.client.get("/api/2/entities/_stream", headers=headers)
        assert res.status_code == 200, res
        lines = len(res.data.split(b"\n"))
        assert 27 == lines, lines
