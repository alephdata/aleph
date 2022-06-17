# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

from unittest import TestCase
from aleph.search.parser import SearchQueryParser
from aleph.search.query import Query


def query(args):
    return Query(SearchQueryParser(args, None))


class QueryTestCase(TestCase):
    def setUp(self):
        # Allow list elements to be in any order
        self.addTypeEqualityFunc(list, self.assertItemsEqual)

    # The standard assertDictEqual doesn't compare values
    # using assertEquals, so it fails to allow lists to be
    # in any order
    def assertDictEqual(self, d1, d2, msg=None):
        for k, v1 in d1.items():
            self.assertIn(k, d2, msg)
            v2 = d2[k]
            self.assertEqual(v1, v2, msg)

    # The standard assertItemsEqual doesn't use assertEquals
    # so fails to correctly compare complex data types
    def assertItemsEqual(self, items1, items2, msg=None):
        for item1 in items1:
            has_equal = False
            for item2 in items2:
                try:
                    self.assertEqual(item1, item2)
                    has_equal = True
                    break
                except Exception:
                    pass
            if not has_equal:
                self.fail("Item %r missing" % item1)

    def test_no_text(self):
        q = query([])
        self.assertEqual(q.get_text_query(), [{"match_all": {}}])

    def test_has_text(self):
        q = query([("q", "search text")])
        text_q = q.get_text_query()
        self.assertEqual(text_q[0]["query_string"]["query"], "search text")

    def test_has_prefix(self):
        q = query([("prefix", "tex")])
        text_q = q.get_text_query()
        self.assertEqual(text_q[0]["match_phrase_prefix"]["name"], "tex")

    def test_id_filter(self):
        q = query(
            [
                ("filter:id", "5"),
                ("filter:id", "8"),
                ("filter:id", "2"),
                ("filter:_id", "3"),
            ]
        )

        self.assertEqual(q.get_filters(), [{"ids": {"values": ["8", "5", "2", "3"]}}])

    def test_filters(self):
        q = query(
            [
                ("filter:key1", "foo"),
                ("filter:key1", "bar"),
                ("filter:key2", "blah"),
                ("filter:key2", "blahblah"),
                ("filter:gte:date", "2018"),
            ]
        )

        self.assertEqual(
            q.get_filters(),
            [
                {"terms": {"key1": ["foo", "bar"]}},
                {"terms": {"key2": ["blah", "blahblah"]}},
                {"range": {"date": {"gte": "2018"}}},
            ],
        )

    def test_offset(self):
        q = query([("offset", 10), ("limit", 100)])
        body = q.get_body()
        self.assertDictContainsSubset({"from": 10, "size": 100}, body)

    def test_post_filters(self):
        q = query(
            [
                ("filter:key1", "foo"),
                ("filter:key2", "foo"),
                ("filter:key2", "bar"),
                ("facet", "key2"),
                ("filter:key3", "blah"),
                ("filter:key3", "blahblah"),
                ("facet", "key3"),
            ]
        )
        self.assertEqual(q.get_filters(), [{"term": {"key1": "foo"}}])
        self.assertEqual(
            q.get_post_filters(),
            {
                "bool": {
                    "filter": [
                        {"terms": {"key2": ["foo", "bar"]}},
                        {"terms": {"key3": ["blah", "blahblah"]}},
                    ]
                }
            },
        )
