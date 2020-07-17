# -*- coding: utf-8 -*-
from .support import TestCase


class CSVIngestorTest(TestCase):
    def test_simple_csv(self):
        fixture_path, entity = self.fixture("countries.csv")
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(entity.first("processingStatus"), self.manager.STATUS_SUCCESS)
        self.assertTrue(entity.has("csvHash"))
        self.assertEqual(int(entity.first("rowCount")), 257)

    def test_nonutf_csv(self):
        fixture_path, entity = self.fixture("countries_nonutf.csv")
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(entity.first("processingStatus"), self.manager.STATUS_SUCCESS)
        self.assertTrue(entity.has("csvHash"))
        self.assertEqual(int(entity.first("rowCount")), 22)
