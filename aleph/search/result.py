import math
import logging
from pprint import pprint, pformat  # noqa

from aleph.core import url_external
from aleph.index.util import unpack_result
from aleph.search.parser import QueryParser
from aleph.search.facet import (
    CategoryFacet,
    CollectionFacet,
    CountryFacet,
    LanguageFacet,
    SchemaFacet,
    EventFacet,
    Facet,
    EntityFacet,
)

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
        if self.parser.next_limit == 0:
            return 1
        return int(math.ceil(self.total / float(self.parser.next_limit)))

    def make_url(self, offset):
        args = [("offset", str(offset)), ("limit", str(self.parser.next_limit))]
        args.extend(self.parser.items)
        return url_external(self.request.path, args)

    @property
    def next_url(self):
        offset = self.parser.offset + self.parser.limit
        if offset > self.total:
            return None
        return self.make_url(offset)

    @property
    def previous_url(self):
        offset = self.parser.offset - self.parser.next_limit
        if offset < 0:
            return None
        return self.make_url(offset)

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
            "limit": self.parser.next_limit,
            "offset": self.parser.offset,
            "pages": self.pages,
            "next": self.next_url,
            "previous": self.previous_url,
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
        "language": LanguageFacet,
        "countries": CountryFacet,
        "country": CountryFacet,
        "category": CategoryFacet,
        "schema": SchemaFacet,
        "schemata": SchemaFacet,
        "event": EventFacet,
        "entity": EntityFacet,
    }

    def __init__(self, request, query):
        super(SearchQueryResult, self).__init__(request, parser=query.parser)
        self.query = query
        result = query.search()
        hits = result.get("hits", {})
        total = hits.get("total", {})
        self.total = total.get("value")
        self.total_type = total.get("relation")
        self.aggregations = result.get("aggregations")
        for doc in hits.get("hits", []):
            # log.info("Res: %s", pformat(doc))
            doc = unpack_result(doc)
            if doc is not None:
                self.results.append(doc)

    def get_facets(self):
        facets = {}
        for name in self.parser.facet_names:
            facet_type = self.parser.get_facet_type(name)

            if facet_type is None:
                facet_type = name

            facet_cls = self.FACETS.get(facet_type, Facet)
            facets[name] = facet_cls(name, self.aggregations, self.parser)
        return facets

    def to_dict(self, serializer=None):
        data = super(SearchQueryResult, self).to_dict(serializer=serializer)
        data["facets"] = self.get_facets()
        data["query_text"] = self.query.to_text()
        return data
