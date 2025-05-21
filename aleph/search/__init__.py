import logging
from banal import ensure_list
from flask_babel import gettext
from followthemoney import model
from werkzeug.exceptions import BadRequest

from aleph.index.indexes import entities_read_index
from aleph.index.collections import collections_index
from aleph.index.xref import xref_index, XREF_SOURCE
from aleph.index.notifications import notifications_index
from aleph.index.entities import ENTITY_SOURCE
from aleph.logic.matching import match_query
from aleph.logic.notifications import get_role_channels
from aleph.logic.xref import SCORE_CUTOFF
from aleph.search.parser import QueryParser, SearchQueryParser  # noqa
from aleph.search.result import QueryResult, DatabaseQueryResult  # noqa
from aleph.search.query import Query

log = logging.getLogger(__name__)


class CollectionsQuery(Query):
    TEXT_FIELDS = ["label^3", "text"]
    SORT_DEFAULT = ["_score", {"label.kw": "asc"}]
    SKIP_FILTERS = ["writeable"]
    PREFIX_FIELD = "label"
    SOURCE = {"excludes": ["text"]}

    def get_filters(self, **kwargs):
        filters = super(CollectionsQuery, self).get_filters(**kwargs)
        if self.parser.getbool("filter:writeable"):
            ids = self.parser.authz.collections(self.parser.authz.WRITE)
            filters.append({"ids": {"values": ids}})
        return filters

    def get_text_query(self):
        query = super().get_text_query()

        # By default, queries use the Elasticsearch `query_string` query which considers only
        # exact matches. Users expect the collection search to match variations of the same
        # word by default (e.g. Russia/Russian, owner/owners, leas/leaked), without using explicit
        # advanced query syntax to enable fuzzy matching.
        # As the `query_string` query does not support enabling fuzzy matching by default, we add
        # a second subquery to handle this. This allows users to still use the advanced query syntax
        # in cases that aren’t covered by the default fuzziness (e.g. prefixes/wildcard searches).
        if self.parser.text:
            query.append(
                {
                    "multi_match": {
                        "query": self.parser.text,
                        "fields": ensure_list(self.TEXT_FIELDS),
                        "operator": "AND",
                        "fuzziness": "AUTO:3,4",
                    }
                }
            )

        return query

    def get_index(self):
        return collections_index()


class EntitiesQuery(Query):
    TEXT_FIELDS = ["fingerprints.text^3", "text"]
    PREFIX_FIELD = "fingerprints.text"
    HIGHLIGHT_FIELD = "properties.*"
    SKIP_FILTERS = ["schema", "schemata"]
    SOURCE = ENTITY_SOURCE
    SORT_DEFAULT = []

    def get_index(self):
        schemata = self.parser.getlist("filter:schema")
        if len(schemata):
            return entities_read_index(schema=schemata, expand=False)
        schemata = self.parser.getlist("filter:schemata")
        if not len(schemata):
            raise BadRequest(gettext("No schema is specified for the query."))
        return entities_read_index(schema=schemata)


class MatchQuery(EntitiesQuery):
    """Given an entity, find the most similar other entities."""

    def __init__(self, parser, entity=None, exclude=None, collection_ids=None):
        self.entity = entity
        self.exclude = ensure_list(exclude)
        self.collection_ids = collection_ids
        super(MatchQuery, self).__init__(parser)

    def get_index(self):
        # Attempt to find only matches within the "matchable" set of
        # entity schemata. For example, a Company and be matched to
        # another company or a LegalEntity, but not a Person.
        # Real estate is "unmatchable", i.e. even if two plots of land
        # have almost the same name and criteria, it does not make
        # sense to suggest they are the same.
        schemata = list(self.entity.schema.matchable_schemata)
        return entities_read_index(schema=schemata)

    def get_query(self):
        query = super(MatchQuery, self).get_query()
        query = match_query(
            self.entity, collection_ids=self.collection_ids, query=query
        )
        if len(self.exclude):
            exclude = {"ids": {"values": self.exclude}}
            query["bool"]["must_not"].append(exclude)
        return query


class GeoDistanceQuery(EntitiesQuery):
    """Given an Address entity, find the nearby Address entities via the
    geo_point field"""

    def __init__(self, parser, entity=None, exclude=None, collection_ids=None):
        self.entity = entity
        self.exclude = ensure_list(exclude)
        self.collection_ids = collection_ids
        super(EntitiesQuery, self).__init__(parser)

    def is_valid(self) -> bool:
        return (
            self.entity is not None
            and self.entity.first("latitude") is not None
            and self.entity.first("longitude") is not None
        )

    def get_index(self):
        # This query can only work on Address and RealEstate entities and its index with the
        # geo_point field
        return f'{entities_read_index(schema=model.get("Address"))},{entities_read_index(schema=model.get("RealEstate"))}'

    def get_query(self):
        if not self.is_valid():
            return {"match_none": {}}
        query = super(GeoDistanceQuery, self).get_query()
        exclude = {"ids": {"values": self.exclude + [self.entity.id]}}
        query["bool"]["must_not"].append(exclude)
        query["bool"]["must"].append({"exists": {"field": "geo_point"}})
        return query

    def get_sort(self):
        """Always sort by calculated distance"""
        if not self.is_valid():
            return []
        return [
            {
                "_geo_distance": {
                    "geo_point": {
                        "lat": self.entity.first("latitude"),
                        "lon": self.entity.first("longitude"),
                    },
                    "order": "asc",
                    "unit": "km",
                    "mode": "min",
                    "distance_type": "plane",  # faster
                }
            }
        ]


class XrefQuery(Query):
    TEXT_FIELDS = ["text"]
    SORT_DEFAULT = [{"score": "desc"}]
    SORT_FIELDS = {
        "random": "random",
        "doubt": "doubt",
        "score": "_score",
    }
    AUTHZ_FIELD = "match_collection_id"
    SCORE_CUTOFF = SCORE_CUTOFF
    SOURCE = XREF_SOURCE

    def __init__(self, parser, collection_id=None):
        self.collection_id = collection_id
        parser.highlight = False
        super(XrefQuery, self).__init__(parser)

    def get_filters(self, **kwargs):
        filters = super(XrefQuery, self).get_filters(**kwargs)
        filters.append({"term": {"collection_id": self.collection_id}})
        sorts = [f for (f, _) in self.parser.sorts]
        if "random" not in sorts and "doubt" not in sorts:
            filters.append({"range": {"score": {"gt": self.SCORE_CUTOFF}}})
        return filters

    def get_index(self):
        return xref_index()


class NotificationsQuery(Query):
    AUTHZ_FIELD = None
    TEXT_FIELDS = ["text"]
    SORT_DEFAULT = [{"created_at": {"order": "desc"}}]

    def get_text_query(self):
        return [{"match_all": {}}]

    def get_filters(self, **kwargs):
        channels = get_role_channels(self.parser.authz.role)
        filters = super(NotificationsQuery, self).get_filters(**kwargs)
        filters.append({"terms": {"channels": channels}})
        return filters

    def get_negative_filters(self):
        return [{"term": {"actor_id": self.parser.authz.role.id}}]

    def get_index(self):
        return notifications_index()


class EntitySetItemsQuery(EntitiesQuery):
    SKIP_FILTERS = []

    def __init__(self, *args, **kwargs):
        self.entityset = kwargs.pop("entityset")
        super(EntitySetItemsQuery, self).__init__(*args, **kwargs)

    def get_filters(self, **kwargs):
        filters = super(EntitySetItemsQuery, self).get_filters(**kwargs)
        filters.append({"ids": {"values": self.entityset.entities}})
        return filters

    def get_index(self):
        return entities_read_index()
