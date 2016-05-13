# from datetime import datetime, timedelta

from aleph.crawlers.directory import DirectoryCrawler
from aleph.core import db
from aleph.model import DocumentRecord, Document
from aleph.tests.util import TestCase


class ETLTestCase(TestCase):

    def setUp(self):
        super(ETLTestCase, self).setUp()

    def test_load_csv_file(self):
        csv_path = self.get_fixture_path('experts.csv')
        crawler = DirectoryCrawler()
        crawler.execute(directory=csv_path)
        assert Document.all().count() == 1, Document.all().count()
        records = db.session.query(DocumentRecord).all()
        assert len(records) == 14, len(records)
        rec0 = records[0]
        assert str(rec0.id) in repr(rec0), repr(rec0)
        assert 'experts.csv' in rec0.document.meta.file_name, \
            rec0.document.meta
        assert 'nationality' in rec0.data, rec0.data
        assert 'name' in rec0.data, rec0.data

        doc = rec0.document
        assert 'experts' in repr(doc)

        doc.delete_records()
        records = db.session.query(DocumentRecord).all()
        assert len(records) == 0, len(records)

    def test_load_sample_directory(self):
        csv_path = self.get_fixture_path('samples')
        crawler = DirectoryCrawler()
        crawler.execute(directory=csv_path)
