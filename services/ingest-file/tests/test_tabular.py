# -*- coding: utf-8 -*-
from .support import TestCase


class TabularIngestorTest(TestCase):
    def test_simple_xlsx(self):
        fixture_path, entity = self.fixture("file.xlsx")
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(entity.first("processingStatus"), self.manager.STATUS_SUCCESS)
        self.assertEqual(entity.schema, "Workbook")
        tables = self.get_emitted("Table")
        self.assertEqual(len(tables), 2)
        titles = [t.first("title") for t in tables]
        self.assertIn("Sheet1", titles)
        table = [t for t in tables if "1" in t.first("title")][0]
        self.assertTrue(table.has("csvHash"))
        self.assertEqual(int(table.first("rowCount")), 3)
        self.assertIn("Mihai Viteazul", table.get("indexText"))

    def test_unicode_xls(self):
        fixture_path, entity = self.fixture("rom.xls")
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(entity.first("processingStatus"), self.manager.STATUS_SUCCESS)
        self.assertEqual(entity.schema, "Workbook")
        tables = self.get_emitted("Table")
        tables = [t.first("title") for t in tables]
        self.assertIn(u"Лист1", tables)

    def test_unicode_ods(self):
        fixture_path, entity = self.fixture("rom.ods")
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(entity.first("processingStatus"), self.manager.STATUS_SUCCESS)
        tables = self.get_emitted("Table")
        tables = [t.first("title") for t in tables]
        self.assertIn(u"Лист1", tables)
        self.assertEqual(entity.schema, "Workbook")
