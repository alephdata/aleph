from aleph.core import archive
from aleph.logic.util import archive_url
from aleph.tests.util import TestCase


class ArchiveApiTestCase(TestCase):
    def setUp(self):
        super(ArchiveApiTestCase, self).setUp()
        self.fixture = self.get_fixture_path("samples/website.html")
        self.content_hash = archive.archive_file(self.fixture)

    def test_no_claim(self):
        res = self.client.get("/api/2/archive")
        assert res.status_code == 401, res

    def test_invalid_claim(self):
        res = self.client.get("/api/2/archive?claim=banana")
        assert res.status_code == 401, res

    def test_anon_claim(self):
        claim_url = archive_url(None, self.content_hash, file_name="foo")
        res = self.client.get(claim_url)
        assert res.status_code == 200, res.status_code
        disposition = res.headers.get("Content-Disposition")
        assert "foo" in disposition, disposition
