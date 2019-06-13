from .support import TestCase


class ImageIngestorTest(TestCase):

    def test_match(self):
        fixture_path, entity = self.fixture('image.svg')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(entity.first('mimeType'), 'image/svg+xml')

    def test_ingest_on_svg(self):
        fixture_path, entity = self.fixture('image.svg')
        self.manager.ingest(fixture_path, entity)
        # print result.to_dict()

        self.assertIn(u'TEST', entity.first('bodyText'))
        # self.assertIn(u'1..2..3..', result.pages[0]['text'])
        self.assertEqual(entity.first('processingStatus'),
                         self.manager.STATUS_SUCCESS)

    def test_ingest_hand_written_text(self):
        fixture_path, entity = self.fixture('some hand wirtten veird text.jpg')
        self.manager.ingest(fixture_path, entity)

        # self.assert(u'Testing ingestors', result.pages[0]['text'])
        self.assertEqual(entity.first('processingStatus'),
                         self.manager.STATUS_SUCCESS)
