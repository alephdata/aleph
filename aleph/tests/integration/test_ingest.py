from aleph.core import db, archive
from aleph.ingest import ingest
from aleph.metadata import Metadata
from aleph.model.common import make_textid
from aleph.tests.util import TestCase
from aleph.tests.factories.models import CollectionFactory


class IngestionIntegrationTest(TestCase):

    def setUp(self):
        super(IngestionIntegrationTest, self).setUp()

        self.col = CollectionFactory.create()
        db.session.commit()

        self.metadata = {
            'crawler': make_textid(),
            'crawler_run': make_textid()
        }

    def test_ingest_paged_document(self):
        self.assertEqual(self.col.documents.count(), 0)

        meta = archive.archive_file(
            self.get_fixture_path('demo.pdf'),
            Metadata.from_data(self.metadata.copy()),
            move=False
        )
        meta.mime_type = 'application/pdf'
        ingest(self.col.id, meta.to_attr_dict())

        self.assertEqual(self.col.documents.count(), 1)

        document = self.col.documents.first()

        self.assertEqual(document.records.count(), 2)
        self.assertEqual(document.records.all()[0].index, 1)
        self.assertEqual(document.records.all()[1].index, 2)

    def test_ingest_non_paged_document(self):
        self.assertEqual(self.col.documents.count(), 0)

        meta = archive.archive_file(
            self.get_fixture_path('samples/tika434.html'),
            Metadata.from_data(self.metadata.copy()),
            move=False
        )
        meta.mime_type = 'text/html'
        ingest(self.col.id, meta.to_attr_dict())

        self.assertEqual(self.col.documents.count(), 1)

        document = self.col.documents.first()

        self.assertEqual(document.records.count(), 1)
        self.assertEqual(document.records.all()[0].index, 1)
