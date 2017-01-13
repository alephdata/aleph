# -*- coding: utf-8 -*-
from datetime import datetime
from unittest import TestCase

from aleph.data.parse import fuzzy_date_parser


class DataParseTestCase(TestCase):

    def test_fuzzy_date_parser_failure(self):
        with self.assertRaisesRegexp(Exception, 'Failed to parse the string.'):
            fuzzy_date_parser('nothing')

    def test_fuzzy_date_parser_success_english(self):
        result = fuzzy_date_parser('15 march, 1987')

        self.assertIsInstance(result, datetime)
        self.assertEqual(result.strftime('%x'), '03/15/87')

    def test_fuzzy_date_parser_success_german(self):
        result = fuzzy_date_parser(u'15. März 1987')

        self.assertIsInstance(result, datetime)
        self.assertEqual(result.strftime('%x'), '03/15/87')

    def test_fuzzy_date_parser_success_spanish(self):
        result = fuzzy_date_parser(u'15 Marzo 1987')

        self.assertIsInstance(result, datetime)
        self.assertEqual(result.strftime('%x'), '03/15/87')
