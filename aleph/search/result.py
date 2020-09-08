import math
import logging
from pprint import pprint, pformat  # noqa

from aleph.core import url_external
from aleph.index.util import unpack_result
from aleph.search.parser import QueryParser
from aleph.search.facet import CategoryFacet, CollectionFacet, CountryFacet
from aleph.search.facet import LanguageFacet, SchemaFacet, EventFacet, Facet

log = logging.getLogger(__name__)


class QueryResult(object):
    def __init__(self, request, parser=None, results=None, total=None):
        self.request = request
        self.parser = parser or QueryParser(request.args, request.authz)
        self.results = results or []
        self.total = total or 0
        self.total_type = "eq"

    @property
    def pages(self):
        if self.parser.limit == 0:
            return 1
        return int(math.ceil(self.total / float(self.parser.limit)))

    def page_url(self, page):
        if page < 1 or page > self.pages:
            return None
        offset = (page - 1) * self.parser.limit
        args = [("offset", str(offset))]
        args.extend(self.parser.items)
        return url_external(self.request.path, args)

    def to_dict(self, serializer=None):
        results = list(self.results)
        if serializer:
            results = serializer().serialize_many(results)

        return {
            "status": "ok",
            "results": results,
            "total": self.total,
            "total_type": self.total_type,
            "page": self.parser.page,
            "limit": self.parser.limit,
            "offset": self.parser.offset,
            "pages": self.pages,
            "next": self.page_url(self.parser.page + 1),
            "previous": self.page_url(self.parser.page - 1),
        }


class DatabaseQueryResult(QueryResult):
    def __init__(self, request, query, parser=None):
        super(DatabaseQueryResult, self).__init__(request, parser=parser)
        self.total = query.count()
        results = query.limit(self.parser.limit)
        results = results.offset(self.parser.offset)
        self.results = results.all()


class SearchQueryResult(QueryResult):
    FACETS = {
        "collection_id": CollectionFacet,
        "match_collection_id": CollectionFacet,
        "languages": LanguageFacet,
        "countries": CountryFacet,
        "category": CategoryFacet,
        "schema": SchemaFacet,
        "schemata": SchemaFacet,
        "event": EventFacet,
    }

    def __init__(self, request, parser, result):
        super(SearchQueryResult, self).__init__(request, parser=parser)
        self.result = result
        hits = self.result.get("hits", {})
        total = hits.get("total", {})
        self.total = total.get("value")
        self.total_type = total.get("relation")
        for doc in hits.get("hits", []):
            # log.info("Res: %s", pformat(doc))
            doc = unpack_result(doc)
            if doc is not None:
                self.results.append(doc)

    def get_facets(self):
        facets = {}
        aggregations = self.result.get("aggregations")
        for name in self.parser.facet_names:
            facet_cls = self.FACETS.get(name, Facet)
            facets[name] = facet_cls(name, aggregations, self.parser)
        return facets

    def to_dict(self, serializer=None):
        data = super(SearchQueryResult, self).to_dict(serializer=serializer)
        data["facets"] = self.get_facets()
        return data
