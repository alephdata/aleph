# -*- coding: utf-8 -*-
from .support import TestCase


class TabularIngestorTest(TestCase):

    def test_simple_xlsx(self):
        fixture_path, entity = self.fixture('file.xlsx')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(
            entity.first('processingStatus'), self.manager.STATUS_SUCCESS
        )
        entities = self.get_emitted('Row')
        assert len(entities) == 5, len(entities)
        cells = ''.join([e.first('cells') for e in entities])
        self.assertIn('Mihai Viteazul', cells)

        tables = self.get_emitted('Table')
        assert len(tables) == 2, tables
        titles = [t.first('title') for t in tables]
        self.assertIn('Sheet1', titles)
        self.assertEqual(entity.schema, 'Workbook')

    def test_unicode_xls(self):
        fixture_path, entity = self.fixture('rom.xls')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(
            entity.first('processingStatus'), self.manager.STATUS_SUCCESS
        )
        self.assertEqual(entity.schema, 'Workbook')
        tables = self.get_emitted('Table')
        tables = [t.first('title') for t in tables]
        self.assertIn(u'Лист1', tables)

    def test_unicode_ods(self):
        fixture_path, entity = self.fixture('rom.ods')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(
            entity.first('processingStatus'), self.manager.STATUS_SUCCESS
        )
        tables = self.get_emitted('Table')
        tables = [t.first('title') for t in tables]
        self.assertIn(u'Лист1', tables)
        self.assertEqual(entity.schema, 'Workbook')
