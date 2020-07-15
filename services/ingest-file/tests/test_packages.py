# -*- coding: utf-8 -*-
from pprint import pprint  # noqa

from .support import TestCase


class PackagesTest(TestCase):
    def test_zip(self):
        fixture_path, entity = self.fixture("test-documents.zip")
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(entity.first("processingStatus"), self.manager.STATUS_SUCCESS)
        self.assertEqual(entity.schema, "Package")

    def test_rar(self):
        fixture_path, entity = self.fixture("test-documents.rar")
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(entity.first("processingStatus"), self.manager.STATUS_SUCCESS)
        self.assertEqual(entity.schema, "Package")

    def test_tar(self):
        fixture_path, entity = self.fixture("test-documents.tar")
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(entity.first("processingStatus"), self.manager.STATUS_SUCCESS)
        self.assertEqual(entity.schema, "Package")
