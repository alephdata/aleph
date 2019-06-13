# -*- coding: utf-8 -*-
from normality.cleaning import decompose_nfkd
from followthemoney.proxy import EntityProxy

from ..support import TestCase


class TextIngestorTest(TestCase):

    def test_match(self):
        fixture_path, entity = self.fixture('utf.txt')
        self.manager.ingest(fixture_path, entity)

        self.assertTrue(isinstance(entity, EntityProxy))
        self.assertEqual(entity.first('mimeType'), 'text/plain')

        self.assertEqual(decompose_nfkd(entity.first('bodyText')),
                         decompose_nfkd(u'Îș unî©ođ€.'))
        self.assertEqual(
            entity.first('processingStatus'), self.manager.STATUS_SUCCESS
        )
        self.assertEqual(entity.schema, 'PlainText')

    def test_ingest_binary_mode(self):
        fixture_path, entity = self.fixture('non_utf.txt')
        self.manager.ingest(fixture_path, entity)

        self.assertIn(u'größter', entity.first('bodyText'))
        self.assertEqual(entity.schema, 'PlainText')

    def test_ingest_extra_fixture(self):
        fixture_path, entity = self.fixture('udhr_ger.txt')
        self.manager.ingest(fixture_path, entity)
        self.assertIsNotNone(entity.first('bodyText'))
        self.assertEqual(entity.schema, 'PlainText')
