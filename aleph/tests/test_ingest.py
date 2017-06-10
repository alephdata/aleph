# from datetime import datetime, timedelta

from aleph.core import db
from aleph.model import Collection
from aleph.ingest import ingest_path
from aleph.model import DocumentRecord, Document
from aleph.tests.util import TestCase


class IngestTestCase(TestCase):

    def setUp(self):
        super(IngestTestCase, self).setUp()
        self.collection = Collection()
        self.collection.label = 'Original Collection'
        self.collection.foreign_id = 'test_coll_entities'
        db.session.add(self.collection)
        db.session.commit()

    def test_load_csv_file(self):
        csv_path = self.get_fixture_path('experts.csv')
        ingest_path(self.collection.id, csv_path)
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

    def test_load_pdf_file(self):
        pdf_path = self.get_fixture_path('demo.pdf')
        ingest_path(self.collection.id, pdf_path)
        assert Document.all().count() == 1, Document.all().count()

    def test_load_sample_directory(self):
        samples_path = self.get_fixture_path('samples')
        ingest_path(self.collection.id, samples_path, id='samples')
        assert Document.all().count() == 5, Document.all().count()
