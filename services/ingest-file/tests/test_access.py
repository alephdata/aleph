# -*- coding: utf-8 -*-
from .support import TestCase


class AccessIngestorTest(TestCase):
    def test_simple_access(self):
        fixture_path, entity = self.fixture("Books_be.mdb")
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(entity.first("processingStatus"), self.manager.STATUS_SUCCESS)
        assert entity.schema.name == "Workbook", entity.schema
        tables = [e for e in self.manager.entities if e.schema.name == "Table"]
        tables = [t for t in tables if t.has("title")]
        assert len(tables), tables
        table0 = tables[0]
        self.assertEqual(table0.first("title"), "Authors")
        self.assertTrue(table0.has("csvHash"))
        self.assertEqual(int(table0.first("rowCount")), 4)
