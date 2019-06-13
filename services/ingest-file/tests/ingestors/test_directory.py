# -*- coding: utf-8 -*-
from pprint import pprint  # noqa

from ..support import TestCase


class DirectoryTest(TestCase):

    def test_normal_directory(self):
        fixture_path, entity = self.fixture('testdir')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(
            entity.first('processingStatus'), self.manager.STATUS_SUCCESS
        )
        self.assertEqual(len(self.manager.entities), 1)
        self.assertEqual(entity.schema, 'Folder')
