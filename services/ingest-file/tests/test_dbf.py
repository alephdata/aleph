# -*- coding: utf-8 -*-
from .support import TestCase


class DBFIngestorTest(TestCase):
    def test_simple_dbf(self):
        fixture_path, entity = self.fixture("PAK_adm1.dbf")
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(entity.first("processingStatus"), self.manager.STATUS_SUCCESS)
        entities = self.get_emitted()
        table = entities[0]
        self.assertEqual(len(entities), 1)
        self.assertEqual(entity.schema, "Table")
        self.assertTrue(entity.has("csvHash"))
        self.assertEqual(int(entity.first("rowCount")), 9)
        self.assertIn("Azad Kashmir", table.get("indexText"))
        self.assertIn("Pakistan", table.get("indexText"))
