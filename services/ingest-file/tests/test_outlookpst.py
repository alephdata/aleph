# -*- coding: utf-8 -*-
from pprint import pprint  # noqa

from .support import TestCase


class OutlookPSTTest(TestCase):

    def test_match(self):
        fixture_path, entity = self.fixture('testPST.pst')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(
            entity.first('processingStatus'), self.manager.STATUS_SUCCESS
        )
        self.assertEqual(entity.schema, 'Package')
