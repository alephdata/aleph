# -*- coding: utf-8 -*-
from pprint import pprint  # noqa
import unittest

from .support import TestCase


class OLMTest(TestCase):
    @unittest.skip("This takes a few minutes to run")
    def test_mbox(self):
        fixture_path, entity = self.fixture("bill_rapp.olm")
        self.manager.ingest(fixture_path, entity)
        self.assertSuccess(entity)
        self.assertEqual(entity.schema.name, "Package")
        entities = self.get_emitted()
        self.assertEqual(len(entities), 1514)
        self.assertEqual(len(self.get_emitted("Email")), 471)
        self.assertEqual(len(self.get_emitted("Folder")), 989)
        email = self.get_emitted_by_id(
            id="8edfaf192a91ba492f01a92e58c694455300b1c3"
        )  # noqa
        self.assertEqual(
            email.first("subject"),
            "Pre-selected NextCard Visa! As low as 2.99% Intro APR! -- Special Offer",  # noqa
        )
