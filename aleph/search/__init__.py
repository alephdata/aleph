import logging

from aleph.index.mapping import TYPE_DOCUMENT, TYPE_RECORD  # noqa
from aleph.index.mapping import TYPE_COLLECTION, TYPE_LINK  # noqa
from aleph.search.query import QueryState  # noqa
from aleph.search.documents import documents_query, documents_iter  # noqa
from aleph.search.documents import entity_documents  # noqa
from aleph.search.entities import entities_query  # noqa
from aleph.search.entities import suggest_entities, similar_entities  # noqa
from aleph.search.entities import load_entity  # noqa
from aleph.search.leads import leads_query, lead_count  # noqa
from aleph.search.records import records_query, execute_records_query  # noqa
from aleph.search.collections import collections_query  # noqa

log = logging.getLogger(__name__)


from aleph.search.parser import QueryParser  # noqa
from aleph.search.result import QueryResult, DatabaseQueryResult  # noqa
from aleph.search.compiler import AuthzQuery


class DocumentsQuery(AuthzQuery):
    DOC_TYPES = [TYPE_DOCUMENT]
    RETURN_FIELDS = ['title', 'collection_id', 'roles']


class CollectionsQuery(AuthzQuery):
    DOC_TYPES = [TYPE_COLLECTION]
    RETURN_FIELDS = True
    TEXT_FIELDS = ['label^3', '_all']
    SORT = {
        'default': [{'$total': 'desc'}, {'name_sort': 'asc'}],
        'score': ['_score', {'name_sort': 'asc'}],
        'name': [{'name_sort': 'asc'}],
    }


class LinksQuery(AuthzQuery):
    DOC_TYPES = [TYPE_LINK]
    RETURN_FIELDS = ['roles', 'remote', 'origin', 'inverted', 'schema',
                     'schemata', 'properties']
    TEXT_FIELDS = ['names^2', '_all']
    SORT = {
        'default': [{'properties.start_date': 'desc'},
                    {'properties.end_date': 'desc'}],
        'score': ['_score', {'name_sort': 'asc'}],
    }

    def __init__(self, parser, entity=None):
        super(LinksQuery, self).__init__(parser)
        self.entity = entity

    def get_filters(self, exclude=None):
        filters = super(LinksQuery, self).get_filters(exclude=exclude)
        if self.entity is not None:
            ids = self.entity.get('ids') or [self.entity.get('id')]
            filters.append({'terms': {'origin.id': ids}})
        return filters
