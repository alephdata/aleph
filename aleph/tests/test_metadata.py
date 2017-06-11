from aleph.model.metadata import Metadata
from aleph.tests.util import TestCase


class MetadataTestCase(TestCase):

    def setUp(self):
        super(MetadataTestCase, self).setUp()

    def test_basic_functions(self):
        meta = Metadata()
        meta.file_name = 'foo.doc'
        meta.title = '  '
        meta.languages = ['en', 'xx']
        assert meta.file_name == 'foo.doc', meta.file_name
        assert meta.title == 'foo.doc', meta.title
        assert not len(meta.countries), meta.countries

    def test_urls(self):
        meta = Metadata()
        meta.urls = ['http://google.com']
        assert len(meta.urls) == 1, meta.urls
        assert len(meta.domains) == 1, meta.domains
        assert meta.domains[0] == 'google.com', meta.domains

        meta = Metadata()
        meta.add_url('http://')
        assert len(meta.urls) == 0, meta.urls

        meta = Metadata()
        meta.add_url('http://www.google.com/xxx')
        assert len(meta.urls) == 1, meta.urls
        assert len(meta.domains) == 1, meta.domains

    def test_emails(self):
        meta = Metadata()
        meta.add_email('huhu@pudo.org')
        assert len(meta.emails) == 1, meta.emails
        assert len(meta.domains) == 1, (meta.emails, meta.domains)
        assert meta.domains[0] == 'pudo.org', meta.domains

        meta = Metadata()
        meta.add_email('not-an-email')
        assert len(meta.emails) == 0, meta.emails

    def test_dates(self):
        meta = Metadata()
        meta.add_date('yada yada')
        assert len(meta.dates) == 0, meta.dates

        # meta.add_date('today')
        # assert len(meta.dates) == 1, meta.dates

        meta = Metadata()
        meta.add_date('2001-01-20')
        assert len(meta.dates) == 1, meta.dates
        meta.add_date('2001-01-20')
        assert len(meta.dates) == 1, meta.dates
        meta.add_date('2002-01-20')
        assert len(meta.dates) == 2, meta.dates
