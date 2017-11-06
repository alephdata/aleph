from unittest import TestCase
from aleph.search.parser import SearchQueryParser
from aleph.search.query import Query

def query(args):
    return Query(SearchQueryParser(args, None))

class QueryTestCase(TestCase):
    def setUp(self):
        # Allow list elements to be in any order
        self.addTypeEqualityFunc(list, self.assertItemsEqual)

    def test_no_text(self):
        q = query([])
        self.assertEqual(q.get_text_query(), {'match_all': {}})

    def test_has_text(self):
        q = query([('q', 'search text')])
        text_q = q.get_text_query()
        self.assertEqual(text_q['simple_query_string']['query'], 'search text')

    def test_id_filter(self):
        q = query([
            ('filter:id', '5'),
            ('filter:id', '8'),
            ('filter:id', '2'),
            ('filter:_id', '3')
        ])

        filters = q.get_filters()
        self.assertEqual(len(filters), 1)
        self.assertEqual(filters[0].keys(), ['ids'])
        self.assertEqual(filters[0]['ids']['values'], ['8', '5', '2', '3'])

    def test_filters(self):
        q = query([
            ('filter:key1', 'foo'),
            ('filter:key1', 'bar'),
            ('filter:key2', 'blah'),
            ('filter:key2', 'blahblah')
        ])

        filters = q.get_filters()
        self.assertEqual(len(filters), 2)
        self.assertEqual(filters[0].keys(), ['terms'])
        self.assertEqual(filters[1].keys(), ['terms'])

        # Extract filters without assuming order
        filter_key1 = filter(lambda f: ['key1'] == f['terms'].keys(), filters)[0]['terms']['key1']
        filter_key2 = filter(lambda f: ['key2'] == f['terms'].keys(), filters)[0]['terms']['key2']

        self.assertEquals(filter_key1, ['foo', 'bar'])
        self.assertEquals(filter_key2, ['blah', 'blahblah'])

    def test_offset(self):
        q = query([('offset', 10), ('limit', 100)])
        body = q.get_body()
        self.assertEqual(body['from'], 10)
        self.assertEqual(body['size'], 100)
