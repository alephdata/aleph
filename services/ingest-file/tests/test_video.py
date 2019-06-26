# -*- coding: utf-8 -*-
import datetime
from .support import TestCase


class VideoIngestorTest(TestCase):

    def test_video(self):
        fixture_path, entity = self.fixture('big_buck_bunny.mp4')
        self.manager.ingest(fixture_path, entity)
        self.assertEqual(
            entity.first('processingStatus'),
            self.manager.STATUS_SUCCESS
        )
        self.assertIn('Hinted Video Track', entity.get('title'))
        self.assertIn(
            datetime.datetime(2010, 2, 9, 1, 55, 39).isoformat(),
            entity.get('authoredAt')
        )
        self.assertEqual(entity.first('duration'), '60095')
        self.assertEqual(entity.schema, 'Video')
