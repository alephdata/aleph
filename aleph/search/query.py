from pprint import pprint  # noqa
from elasticsearch.helpers import scan

from aleph.core import es
from aleph.index.util import authz_query, field_filter_query
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
            ret.append(field_filter_query(field, list(values)))

    if id_values:
        ret.append({'ids': {'values': id_values}})

    return ret


class Query(object):
    RESULT_CLASS = SearchQueryResult
    INCLUDE_FIELDS = None
    EXCLUDE_FIELDS = None
    TEXT_FIELDS = ['text']
    PREFIX_FIELD = 'text'
    SORT_FIELDS = {
        'label': 'label.kw',
        'name': 'name.kw',
        'score': '_score',
    }
    SORT_DEFAULT = ['_score']

    def __init__(self, parser):
        self.parser = parser

    def get_text_query(self):
        query = []
        if self.parser.text:
            query.append({
                "simple_query_string": {
                    "query": self.parser.text,
                    "fields": self.TEXT_FIELDS,
                    "default_operator": "and"
                }
            })
        if self.parser.prefix:
            query.append({
                "match_phrase_prefix": {
                    self.PREFIX_FIELD: self.parser.prefix
                }
            })
        if not len(query):
            query.append({'match_all': {}})
        return query

    def get_filters(self):
        """Apply query filters from the user interface."""
        filters = convert_filters(self.parser.filters)
        if len(self.parser.exclude):
            exclude = {'ids': {'values': self.parser.exclude}}
            filters.append({
                'bool': {'must_not': exclude}
            })
        return filters

    def get_post_filters(self):
        """Apply post-aggregation query filters."""
        return convert_filters(self.parser.post_filters)

    def get_query(self):
        return {
            'bool': {
                'should': [],
                'must': self.get_text_query(),
                'must_not': [],
                'filter': self.get_filters()
            }
        }

    def get_aggregations(self):
        """Aggregate the query in order to generate faceted results."""
        aggregations = {}
        for facet_name in self.parser.facet_names:
            if self.parser.facet_values:
                aggregations[facet_name] = {
                    'terms': {
                        'field': facet_name,
                        'size': self.parser.facet_size
                    }
                }

            if self.parser.facet_total:
                # Option to return total distinct value counts for
                # a given facet, instead of the top buckets.
                agg_name = '%s.cardinality' % facet_name
                aggregations[agg_name] = {
                    'cardinality': {
                        'field': facet_name
                    }
                }
        return aggregations

    def get_sort(self):
        """Pick one of a set of named result orderings."""
        if not len(self.parser.sorts):
            return self.SORT_DEFAULT

        sort_fields = ['_score']
        for (field, direction) in self.parser.sorts:
            field = self.SORT_FIELDS.get(field, field)
            sort_fields.append({field: direction})
        return list(reversed(sort_fields))

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
