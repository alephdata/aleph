import math
import logging
from banal import hash_data

from aleph.core import url_external
from aleph.index.util import unpack_result
from aleph.search.parser import QueryParser
from aleph.search.facet import CategoryFacet, CollectionFacet, CountryFacet
from aleph.search.facet import LanguageFacet, SchemaFacet, Facet
from aleph.util import result_key

log = logging.getLogger(__name__)


class QueryResult(object):

    def __init__(self, request, parser=None, results=None, total=None,
                 schema=None):
        self.request = request
        self.parser = parser or QueryParser(request.args, request.authz)
        self.schema = schema
        self.results = results or []
        self.total = total or 0

    @property
    def pages(self):
        if self.parser.limit == 0:
            return 1
        return int(math.ceil(self.total / float(self.parser.limit)))

    def page_url(self, page):
        if page < 1 or page > self.pages:
            return None
        offset = (page - 1) * self.parser.limit
        args = [('offset', str(offset))]
        args.extend(self.parser.items)
        return url_external(self.request.path, args)

    @property
    def cache_key(self):
        """Generate a key for the current result."""
        results = [result_key(r) for r in self.results]
        return hash_data((self.parser.cache_key, self.total, results))

    def to_dict(self):
        results = list(self.results)
        if self.schema:
            results, errors = self.schema().dump(results, many=True)
            if len(errors):
                return {
                    'status': 'error',
                    'total': 0,
                    'results': [],
                    'errors': errors
                }

        return {
            'status': 'ok',
            'results': results,
            'total': self.total,
            'page': self.parser.page,
            'limit': self.parser.limit,
            'offset': self.parser.offset,
            'pages': self.pages,
            'next': self.page_url(self.parser.page + 1),
            'previous': self.page_url(self.parser.page - 1),
        }


class DatabaseQueryResult(QueryResult):

    def __init__(self, request, query, parser=None, schema=None):
        super(DatabaseQueryResult, self).__init__(request,
                                                  parser=parser,
                                                  schema=schema)
        self.total = query.count()
        results = query.limit(self.parser.limit)
        results = results.offset(self.parser.offset)
        self.results = results.all()


class SearchQueryResult(QueryResult):
    FACETS = {
        'collection_id': CollectionFacet,
        'languages': LanguageFacet,
        'countries': CountryFacet,
        'category': CategoryFacet,
        'schema': SchemaFacet,
        'schemata': SchemaFacet
    }

    def __init__(self, request, parser, result, schema=None):
        super(SearchQueryResult, self).__init__(request,
                                                parser=parser,
                                                schema=schema)
        self.result = result
        hits = self.result.get('hits', {})
        self.total = hits.get('total')
        for doc in hits.get('hits', []):
            doc = unpack_result(doc)
            if doc is not None:
                self.results.append(doc)

    def get_facets(self):
        facets = {}
        aggregations = self.result.get('aggregations')
        for name in self.parser.facet_names:
            facet_cls = self.FACETS.get(name, Facet)
            facets[name] = facet_cls(name, aggregations, self.parser)
        return facets

    def to_dict(self):
        data = super(SearchQueryResult, self).to_dict()
        data['facets'] = self.get_facets()
        return data
