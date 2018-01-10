from pprint import pprint  # noqa
from elasticsearch.helpers import scan

from aleph.core import es
from aleph.index.util import authz_query
from aleph.search.result import SearchQueryResult
from aleph.search.parser import SearchQueryParser


def convert_filters(filters):
    ret = []
    id_values = []

    for field, values in filters.iteritems():
        # Combine id or _id into one filter
        if field in ['id', '_id']:
            id_values.extend(values)
        else:
            ret.append({'terms': {field: list(values)}})

    if id_values:
        ret.append({'ids': {'values': id_values}})

    return ret


class Query(object):
    RESULT_CLASS = SearchQueryResult
    INCLUDE_FIELDS = None
    EXCLUDE_FIELDS = None
    TEXT_FIELDS = ['text']
    SORT = {
        'default': ['_score']
    }

    def __init__(self, parser):
        self.parser = parser

    def get_text_query(self):
        if not self.parser.text:
            return {'match_all': {}}
        return {
            "simple_query_string": {
                "query": self.parser.text,
                "fields": self.TEXT_FIELDS,
                "default_operator": "AND"
            }
        }

    def get_filters(self):
        """Apply query filters from the user interface."""
        return convert_filters(self.parser.filters)

    def get_post_filters(self):
        """Apply post-aggregation query filters."""
        return convert_filters(self.parser.post_filters)

    def get_query(self):
        return {
            'bool': {
                'should': [],
                'must': [self.get_text_query()],
                'must_not': [],
                'filter': self.get_filters()
            }
        }

    def get_aggregations(self):
        """Aggregate the query in order to generate faceted results."""
        return {
            name: {
                'terms': {
                    'field': name,
                    'size': self.parser.facet_size
                }
            }
            for name in self.parser.facet_names
        }

    def get_sort(self):
        """Pick one of a set of named result orderings."""
        default = self.SORT.get('default')
        return self.SORT.get(self.parser.sort, default)

    def get_highlight(self):
        return {}

    def get_source(self):
        source = {}
        if self.INCLUDE_FIELDS:
            source['includes'] = self.INCLUDE_FIELDS
        elif self.EXCLUDE_FIELDS:
            source['excludes'] = self.EXCLUDE_FIELDS
        return source

    def get_body(self):
        body = {
            'query': self.get_query(),
            'from': self.parser.offset,
            'size': self.parser.limit,
            'aggregations': self.get_aggregations(),
            'sort': self.get_sort(),
            'highlight': self.get_highlight(),
            '_source': self.get_source()
        }

        post_filters = self.get_post_filters()
        if post_filters:
            body['post_filter'] = {
                'bool': {
                    'filter': post_filters
                }
            }

        return body

    def search(self):
        """Execute the query as assmbled."""
        # pprint(self.get_body())
        return es.search(index=self.get_index(),
                         body=self.get_body())

    def scan(self):
        """Return an iterator over the whole result set, unpaginated and
        without aggregations."""
        body = {
            'query': self.get_query(),
            '_source': self.get_source()
        }
        return scan(es,
                    index=self.get_index(),
                    query=body)

    @classmethod
    def handle(cls, request, limit=None, schema=None, **kwargs):
        parser = SearchQueryParser(request.args, request.authz, limit=limit)
        result = cls(parser, **kwargs).search()
        return cls.RESULT_CLASS(request, parser, result, schema=schema)


class AuthzQuery(Query):
    """Apply roles-based filtering to the results.

    This enforces the authorization (access control) rules on a particular
    query by comparing the roles a user is in with the ones on the document.
    """

    def get_filters(self):
        filters = super(AuthzQuery, self).get_filters()
        filters.append(authz_query(self.parser.authz))
        return filters
