# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT


# from datetime import datetime, timedelta

from aleph.model import Document
from aleph.logic.documents import crawl_directory
from aleph.tests.util import TestCase


class IngestTestCase(TestCase):
    def setUp(self):
        super(IngestTestCase, self).setUp()
        self.collection = self.create_collection()

    def test_crawl_sample_directory(self):
        samples_path = self.get_fixture_path("samples")
        crawl_directory(self.collection, samples_path)
        assert Document.all().count() == 4, Document.all().count()
