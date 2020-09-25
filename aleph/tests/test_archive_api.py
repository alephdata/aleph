from aleph.core import archive
from aleph.authz import Authz
from aleph.logic.util import archive_url
from aleph.tests.util import TestCase


class ArchiveApiTestCase(TestCase):
    def setUp(self):
        super(ArchiveApiTestCase, self).setUp()
        self.fixture = self.get_fixture_path("samples/website.html")
        self.content_hash = archive.archive_file(self.fixture)
        self.fixture2 = self.get_fixture_path("samples/taggable.txt")
        self.content_hash2 = archive.archive_file(self.fixture2)

    def test_no_claim(self):
        url = "/api/2/archive/%s" % self.content_hash
        res = self.client.get(url)
        assert res.status_code == 401, res

    def test_invalid_claim(self):
        url = "/api/2/archive/%s" % self.content_hash
        res = self.client.get(url + "?claim=banana")
        assert res.status_code == 401, res

    def test_anon_claim(self):
        authz = Authz.from_role(None)
        claim_url = archive_url(authz, self.content_hash, file_name="foo")
        res = self.client.get(claim_url)
        assert res.status_code == 200, res.status_code
        disposition = res.headers.get("Content-Disposition")
        assert "foo" in disposition, disposition
