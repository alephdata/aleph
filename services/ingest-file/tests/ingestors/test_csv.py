# -*- coding: utf-8 -*-
from ..support import TestCase


class CSVIngestorTest(TestCase):

    def test_simple_csv(self):
        fixture_path, entity = self.fixture('countries.csv')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(
            entity.first('processingStatus'), self.manager.STATUS_SUCCESS
        )
        # 256 rows + 1 table
        entities = self.get_emitted()
        self.assertEqual(len(entities), 256+1)
        self.assertEqual(entity.schema, 'Table')

    def test_nonutf_csv(self):
        fixture_path, entity = self.fixture('countries_nonutf.csv')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(
            entity.first('processingStatus'), self.manager.STATUS_SUCCESS
        )
        # 20 rows + 1 table
        entities = self.get_emitted()
        self.assertEqual(len(entities), 20+1)
        self.assertEqual(entity.schema, 'Table')
