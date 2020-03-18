import logging
from flask_babel import gettext
from werkzeug.exceptions import BadRequest

from aleph.index.indexes import entities_read_index
from aleph.index.collections import collections_index
from aleph.index.xref import xref_index
from aleph.index.entities import EXCLUDE_DEFAULT
from aleph.logic.matching import match_query
from aleph.search.parser import QueryParser, SearchQueryParser  # noqa
from aleph.search.result import QueryResult, DatabaseQueryResult  # noqa
from aleph.search.result import SearchQueryResult  # noqa
from aleph.search.query import Query

log = logging.getLogger(__name__)


class CollectionsQuery(Query):
    TEXT_FIELDS = ['label^3', 'text']
    SORT_DEFAULT = ['_score', {'label.kw': 'asc'}]
    SKIP_FILTERS = ['writeable']
    PREFIX_FIELD = 'label'

    def get_filters(self):
        filters = super(CollectionsQuery, self).get_filters()
        if self.parser.getbool('filter:writeable'):
            ids = self.parser.authz.collections(self.parser.authz.WRITE)
            filters.append({'ids': {'values': ids}})
        return filters

    def get_index(self):
        return collections_index()


class EntitiesQuery(Query):
    TEXT_FIELDS = ['fingerprints.text^3', 'text']
    PREFIX_FIELD = 'names.text'
    SKIP_FILTERS = ['schema', 'schemata']
    EXCLUDE_FIELDS = EXCLUDE_DEFAULT
    SORT_DEFAULT = []

    def get_index(self):
        schemata = self.parser.getlist('filter:schema')
        if len(schemata):
            return entities_read_index(schema=schemata, expand=False)
        schemata = self.parser.getlist('filter:schemata')
        if not len(schemata):
            raise BadRequest(gettext("No schema is specified for the query."))
        return entities_read_index(schema=schemata)


class MatchQuery(EntitiesQuery):
    """Given an entity, find the most similar other entities."""

    def __init__(self, parser, entity=None, collection_ids=None):
        self.entity = entity
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
        return match_query(self.entity,
                           collection_ids=self.collection_ids,
                           query=query)


class XrefQuery(Query):
    TEXT_FIELDS = ['text']
    SORT_DEFAULT = [{'score': 'desc'}]
    AUTHZ_FIELD = 'match_collection_id'

    def __init__(self, parser, collection_id=None):
        self.collection_id = collection_id
        parser.highlight = False
        # parser.sorts = []
        super(XrefQuery, self).__init__(parser)

    def get_filters(self):
        filters = super(XrefQuery, self).get_filters()
        filters.append({'term': {'collection_id': self.collection_id}})
        return filters

    def get_index(self):
        return xref_index()
