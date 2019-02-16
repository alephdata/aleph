import logging

from aleph.index.indexes import entities_read_index
from aleph.index.indexes import collections_index
from aleph.index.entities import EXCLUDE_DEFAULT
from aleph.index.match import match_query
from aleph.search.parser import QueryParser, SearchQueryParser  # noqa
from aleph.search.result import QueryResult, DatabaseQueryResult  # noqa
from aleph.search.result import SearchQueryResult  # noqa
from aleph.search.query import Query

log = logging.getLogger(__name__)


class EntitiesQuery(Query):
    TEXT_FIELDS = ['name^3', 'text']
    PREFIX_FIELD = 'names.text'
    SKIP_FILTERS = ['schema', 'schemata']
    EXCLUDE_FIELDS = EXCLUDE_DEFAULT
    SORT_DEFAULT = []

    def get_index(self):
        schemata = self.parser.getlist('filter:schema')
        schemata = schemata or self.parser.getlist('filter:schemata')
        if len(schemata):
            return entities_read_index(schema=schemata)
        return entities_read_index()


class MatchQuery(EntitiesQuery):
    """Given an entity, find the most similar other entities."""

    def __init__(self, parser, entity=None, collection_ids=None):
        self.entity = entity
        self.collection_ids = collection_ids
        super(MatchQuery, self).__init__(parser)

    def get_query(self):
        query = super(MatchQuery, self).get_query()
        return match_query(self.entity,
                           collection_ids=self.collection_ids,
                           query=query)


class CollectionsQuery(Query):
    TEXT_FIELDS = ['label^3', 'text']
    SORT_DEFAULT = ['_score', {'label.kw': 'asc'}]
    PREFIX_FIELD = 'label'

    def get_index(self):
        return collections_index()
