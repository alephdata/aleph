import logging
from pprint import pprint, pformat  # noqa
from elasticsearch.helpers import scan

from aleph.core import es, settings
from aleph.model import Audit
from aleph.index.util import authz_query, field_filter_query
from aleph.index.util import search_safe, clean_query
from aleph.search.result import SearchQueryResult
from aleph.search.parser import SearchQueryParser
from aleph.logic.audit import record_audit

log = logging.getLogger(__name__)


def convert_filters(filters):
    ret = []
    for field, values in filters.items():
        ret.append(field_filter_query(field, values))
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
                    "analyzer": "icu_latin",
                    "default_operator": "AND",
                    "minimum_should_match": "80%",
                    "lenient": True
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
        filters = []
        for field, values in self.parser.filters.items():
            if field not in self.parser.facet_names:
                filters.append(field_filter_query(field, values))
        return filters

    def get_negative_filters(self):
        """Apply negative filters."""
        filters = []
        for field, values in self.parser.empties.items():
            filters.append({'exists': {'field': field}})

        if len(self.parser.exclude):
            filters.append({'ids': {'values': self.parser.exclude}})
        return filters

    def get_post_filters(self, exclude=None):
        """Apply post-aggregation query filters."""
        filters = []
        for field, values in self.parser.filters.items():
            if field == exclude:
                continue
            if field in self.parser.facet_filters:
                filters.append(field_filter_query(field, values))
        return {'bool': {'filter': filters}}

    def get_query(self):
        return {
            'bool': {
                'should': self.get_text_query(),
                'must': [],
                'must_not': self.get_negative_filters(),
                'filter': self.get_filters(),
                'minimum_should_match': 1
            }
        }

    def get_aggregations(self):
        """Aggregate the query in order to generate faceted results."""
        aggregations = {}
        for facet_name in self.parser.facet_names:
            facet_aggregations = {}
            if self.parser.get_facet_values(facet_name):
                facet_aggregations[facet_name] = {
                    'terms': {
                        'field': facet_name,
                        'size': self.parser.get_facet_size(facet_name)
                    }
                }

            if self.parser.get_facet_total(facet_name):
                # Option to return total distinct value counts for
                # a given facet, instead of the top buckets.
                agg_name = '%s.cardinality' % facet_name
                facet_aggregations[agg_name] = {
                    'cardinality': {
                        'field': facet_name
                    }
                }

            if not len(facet_aggregations):
                break

            # See here for an explanation of the whole post_filters and
            # aggregation filters thing:
            # https://www.elastic.co/guide/en/elasticsearch/reference/6.2/search-request-post-filter.html  # noqa
            other_filters = self.get_post_filters(exclude=facet_name)
            if len(other_filters['bool']['filter']):
                agg_name = '%s.filtered' % facet_name
                aggregations[agg_name] = {
                    'filter': other_filters,
                    'aggregations': facet_aggregations
                }
            else:
                aggregations.update(facet_aggregations)

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
        if not settings.RESULT_HIGHLIGHT:
            return {}
        if not self.parser.highlight:
            return {}

        return {
            'fields': {
                'text': {
                    'number_of_fragments': self.parser.highlight_count,
                    'fragment_size': self.parser.highlight_length
                }
            }
        }

    def get_source(self):
        source = {}
        if self.INCLUDE_FIELDS:
            source['includes'] = self.INCLUDE_FIELDS
        elif self.EXCLUDE_FIELDS:
            source['excludes'] = self.EXCLUDE_FIELDS
        return source

    def get_body(self):
        body = clean_query({
            'query': self.get_query(),
            'post_filter': self.get_post_filters(),
            'from': self.parser.offset,
            'size': self.parser.limit,
            'aggregations': self.get_aggregations(),
            'sort': self.get_sort(),
            'highlight': self.get_highlight(),
            '_source': self.get_source()
        })
        # log.info("Query: %s", pformat(body))
        return body

    def search(self):
        """Execute the query as assmbled."""
        # log.info("Search index: %s", self.get_index())
        result = search_safe(index=self.get_index(),
                             body=self.get_body())
        log.info("Took: %sms", result.get('took'))
        # log.info("%s", pformat(result.get('profile')))
        return result

    def scan(self):
        """Return an iterator over the whole result set, unpaginated and
        without aggregations."""
        query = {
            'query': self.get_query(),
            '_source': self.get_source()
        }
        return scan(es, index=self.get_index(), query=query)

    @classmethod
    def handle(cls, request, limit=None, schema=None, parser=None, **kwargs):
        if parser is None:
            parser = SearchQueryParser(request.args,
                                       request.authz,
                                       limit=limit)

        # Log the search
        keys = ['prefix', 'text', 'filters']
        record_audit(Audit.ACT_SEARCH, keys=keys, **parser.to_dict())
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
