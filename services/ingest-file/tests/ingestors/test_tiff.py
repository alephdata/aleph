from ..support import TestCase


class TIFFIngestorTest(TestCase):

    def test_match(self):
        fixture_path, entity = self.fixture('multipage_tiff_example.tif')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(entity.first('mimeType'), 'image/tiff')
        self.assertEqual(
            entity.first('processingStatus'), self.manager.STATUS_SUCCESS
        )
        entities = self.get_emitted()
        self.assertEqual(len(entities), 11)

    def test_ingest_tiff_format(self):
        fixture_path, entity = self.fixture('hello_world_tiff.tif')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(
            entity.first('processingStatus'), self.manager.STATUS_SUCCESS
        )
        entity = self.get_emitted_by_id(entity.id)
        self.assertEqual(entity.first('indexText'), 'HELLO WORLD')
