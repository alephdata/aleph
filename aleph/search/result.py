import six
import math
from urllib import urlencode

from aleph.search.parser import QueryParser
from aleph.search.facet import CategoryFacet, CollectionFacet, CountryFacet
from aleph.search.facet import LanguageFacet, SchemaFacet, Facet


class QueryResult(object):

    def __init__(self, request, parser=None, results=None, total=None):
        self.request = request
        self.parser = parser or QueryParser(request.args, request.authz)
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
        args = [('offset', six.text_type(offset))]
        args.extend(self.parser.items)
        args = [(k, v.encode('utf-8')) for (k, v) in args]
        return self.request.base_url + '?' + urlencode(args)

    def to_dict(self):
        return {
            'status': 'ok',
            'results': self.results,
            'total': self.total,
            'page': self.parser.page,
            'limit': self.parser.limit,
            'offset': self.parser.offset,
            'pages': self.pages,
            'next': self.page_url(self.parser.page + 1),
            'previous': self.page_url(self.parser.page - 1),
        }


class DatabaseQueryResult(QueryResult):

    def __init__(self, request, query, parser=None):
        super(DatabaseQueryResult, self).__init__(request, parser=parser)
        self.total = query.count()
        results = query.limit(self.parser.limit)
        self.results = results.offset(self.parser.offset)


class SearchQueryResult(QueryResult):
    FACETS = {
        'collection_id': CollectionFacet,
        'languages': LanguageFacet,
        'countries': CountryFacet,
        'category': CategoryFacet,
        'remote.countries': CountryFacet,
        'schema': SchemaFacet,
        'schemata': SchemaFacet
    }

    def __init__(self, request, parser, result):
        super(SearchQueryResult, self).__init__(request, parser=parser)
        self.result = result
        hits = self.result.get('hits', {})
        self.total = hits.get('total')
        for doc in hits.get('hits', []):
            data = doc.pop('_source')
            data['id'] = doc.pop('_id')
            data['$score'] = doc.pop('_score')
            data['$doc_type'] = doc.pop('_type')
            if len(doc.get('highlight', {})):
                data['$highlight'] = {}
                for key, value in doc.get('highlight', {}).items():
                    data['$highlight'][key] = value
            self.results.append(data)

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
