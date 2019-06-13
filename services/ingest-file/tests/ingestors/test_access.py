# -*- coding: utf-8 -*-
from ..support import TestCase


class AccessIngestorTest(TestCase):

    def test_simple_access(self):
        fixture_path, entity = self.fixture('Books_be.mdb')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(
            entity.first('processingStatus'),
            self.manager.STATUS_SUCCESS
        )
        self.assertEqual(len(self.manager.entities), 19)
        assert entity.schema.name == 'Workbook', entity.schema
        tables = [e for e in self.manager.entities if e.schema.name == 'Table']
        tables = [t for t in tables if t.has('title')]
        assert len(tables), tables
        self.assertEqual(tables[0].first('title'), 'Authors')
