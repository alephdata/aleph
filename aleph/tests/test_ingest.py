# from datetime import datetime, timedelta

from aleph.core import db
from aleph.model import Collection, Document, DocumentRecord
from aleph.ingest import ingest_document
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
        document = Document.by_keys(collection=self.collection,
                                    foreign_id='experts.csv')
        db.session.commit()
        db.session.refresh(document)
        ingest_document(document, csv_path)
        assert Document.all().count() == 1, Document.all().count()
        records = db.session.query(DocumentRecord).all()
        assert len(records) == 14, len(records)
        rec0 = records[0]
        assert str(rec0.id) in repr(rec0), repr(rec0)
        assert 'nationality' in rec0.data, rec0.data
        assert 'name' in rec0.data, rec0.data

        doc = rec0.document
        doc.delete_records()
        records = db.session.query(DocumentRecord).all()
        assert len(records) == 0, len(records)

    def test_load_pdf_file(self):
        pdf_path = self.get_fixture_path('demo.pdf')
        document = Document.by_keys(collection=self.collection,
                                    foreign_id='demo.pdf')
        db.session.commit()
        db.session.refresh(document)
        ingest_document(document, pdf_path)
        assert Document.all().count() == 1, Document.all().count()

    def test_load_sample_directory(self):
        samples_path = self.get_fixture_path('samples')
        document = Document.by_keys(collection=self.collection,
                                    foreign_id='samples')
        db.session.commit()
        db.session.refresh(document)
        ingest_document(document, samples_path)
        assert Document.all().count() == 5, Document.all().count()
