# -*- coding: utf-8 -*-
from pprint import pprint  # noqa

from .support import TestCase


class OutlookMsgTest(TestCase):

    def test_match(self):
        fixture_path, entity = self.fixture('piste.msg')
        self.manager.ingest(fixture_path, entity)

        self.assertEqual(entity.first('subject'), 'Ab auf die Piste!')
        self.assertEqual(
            entity.first('processingStatus'), self.manager.STATUS_SUCCESS
        )
