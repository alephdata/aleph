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
        meta.author = 'The Man'
        assert meta.file_name == 'foo.doc', meta.file_name
        assert meta.title == 'foo.doc', meta.title
        assert meta.extension == 'doc', meta.extension
        assert not len(meta.countries), meta.countries
        assert meta.author == 'The Man', meta.author

    def test_file_names(self):
        meta = Metadata()
        meta.file_name = 'Foo Schnasel.doc'
        assert meta.safe_file_name == 'Foo_Schnasel.doc', meta.safe_file_name
        assert meta.file_name == 'Foo Schnasel.doc', meta.file_name

    def test_keywords(self):
        meta = Metadata()
        meta.keywords = ['test']
        assert len(meta.keywords) == 1, meta.keywords
        assert meta.keywords[0] == 'test', meta.keywords

    def test_countries(self):
        meta = Metadata()
        meta.countries = ['xx', 'de']
        assert len(meta.countries) == 1, meta.countries
        assert meta.countries[0] == 'de', meta.countries

    def test_languages(self):
        meta = Metadata()
        meta.countries = ['xx', 'de']
        assert len(meta.countries) == 1, meta.countries
        assert meta.countries[0] == 'de', meta.countries

    def test_dates(self):
        meta = Metadata()
        meta.date = 'yada yada'
        assert len(meta.dates) == 0, meta.dates

        meta = Metadata()
        meta.date = '2001-01-20'
        assert len(meta.dates) == 1, meta.dates
        meta.authored_at = '2001-01-20'
        assert len(meta.dates) == 1, meta.dates
        meta.published_at = '2002-01-20'
        assert len(meta.dates) == 2, meta.dates
