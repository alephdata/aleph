# -*- coding: utf-8 -*-
from .support import TestCase


class DBFIngestorTest(TestCase):

    def test_simple_dbf(self):
        fixture_path, entity = self.fixture('PAK_adm1.dbf')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(
            entity.first('processingStatus'), self.manager.STATUS_SUCCESS
        )
        # 8 rows + 1 table
        entities = self.get_emitted()
        self.assertEqual(len(entities), 8+1)
        self.assertEqual(entity.schema, 'Table')
        rows = self.get_emitted('Row')
        cells = ''.join([e.first('cells') for e in rows])
        self.assertIn('Azad Kashmir', cells)
        self.assertIn('Pakistan', cells)
