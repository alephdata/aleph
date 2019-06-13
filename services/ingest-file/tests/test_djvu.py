# -*- coding: utf-8 -*-
from unittest import skip
from .support import TestCase


class DejaVuIngestorTest(TestCase):

    @skip
    def test_match(self):
        fixture_path, entity = self.fixture('Test_rs20846.djvu')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(entity.first('mimeType'), 'image/vnd.djvu')

        self.assertEqual(len(self.manager.entities), 11+1)
        self.assertIn(u'Executive Orders', self.manager.entities[0].first('bodyText'))  # noqa
        self.assertEqual(entity.schema, 'Pages')
