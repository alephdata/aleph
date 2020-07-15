from unittest import TestCase
from aleph.search.parser import QueryParser

args = QueryParser(
    [
        ("offset", "5"),
        ("filter:key1", "foo1"),
        ("filter:key1", "foo2"),
        ("filter:key2", "foo3"),
        ("filter:key3", "foo4"),
        ("filter:key3", "foo4"),
        ("filter:key2", "foo5"),
        ("myint", 100),
        ("myint", 105),
        ("mybadint", "six"),
        ("mybool", "t"),
        ("mybadbool", "oui"),
    ],
    None,
)


class QueryParserTestCase(TestCase):
    def test_offset(self):
        self.assertEqual(args.offset, 5)

    def test_filters(self):
        self.assertCountEqual(
            list(args.filters.keys()), ["key1", "key2", "key3"]
        )  # noqa
        self.assertEqual(args.filters["key1"], set(["foo1", "foo2"]))
        self.assertEqual(args.filters["key2"], set(["foo3", "foo5"]))
        self.assertEqual(args.filters["key3"], set(["foo4"]))

    def test_getintlist(self):
        self.assertEqual(args.getintlist("myint"), [100, 105])
        self.assertEqual(args.getintlist("notakey"), [])
        self.assertEqual(args.getintlist("notakey", [8]), [8])

    def test_getint(self):
        self.assertEqual(args.getint("myint"), 100)
        self.assertEqual(args.getint("mybadint"), None)
        self.assertEqual(args.getint("notakey"), None)
        self.assertEqual(args.getint("notakey", 8), 8)

    def test_getbool(self):
        self.assertEqual(args.getbool("mybool"), True)
        self.assertEqual(args.getbool("mybadbool"), False)
        self.assertEqual(args.getbool("notakey"), False)
        self.assertEqual(args.getbool("notakey", True), True)

    def test_to_dict(self):
        parser_dict = args.to_dict()
        self.assertEqual(
            set(parser_dict.keys()),
            set(
                [
                    "text",
                    "prefix",
                    "offset",
                    "limit",
                    "filters",
                    "sorts",
                    "empties",
                    "excludes",
                ]
            ),
        )
        self.assertEqual(parser_dict["text"], None)
        self.assertEqual(parser_dict["prefix"], None)
        self.assertEqual(parser_dict["offset"], 5)
        self.assertEqual(parser_dict["limit"], 20)
        self.assertEqual(list(parser_dict["filters"].keys()), ["key1", "key2", "key3"])
        self.assertEqual(set(parser_dict["filters"]["key1"]), set(["foo1", "foo2"]))
        self.assertEqual(set(parser_dict["filters"]["key2"]), set(["foo3", "foo5"]))
        self.assertEqual(set(parser_dict["filters"]["key3"]), set(["foo4"]))
