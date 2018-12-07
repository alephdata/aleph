import logging

from aleph.model import Document, DocumentRecord
from aleph.index.core import entities_read_index
from aleph.index.core import records_read_index
from aleph.index.core import collections_index
from aleph.index.match import match_query
from aleph.search.parser import QueryParser, SearchQueryParser  # noqa
from aleph.search.result import QueryResult, DatabaseQueryResult  # noqa
from aleph.search.result import SearchQueryResult  # noqa
from aleph.search.query import Query, AuthzQuery

log = logging.getLogger(__name__)


class EntitiesQuery(AuthzQuery):
    TEXT_FIELDS = ['name^3', 'text']
    EXCLUDE_FIELDS = ['roles', 'text', 'fingerprints']
    SORT_DEFAULT = ['_score']

    def get_index(self):
        # schema = self.parser.getlist('filter:schema')
        # if len(schema):
        #     return entities_read_index(schema=schema, descendants=False)
        schemata = self.parser.getlist('filter:schemata')
        if len(schemata):
            return entities_read_index(schema=schemata)
        return entities_read_index()


class DocumentsQuery(EntitiesQuery):

    def get_filters(self):
        filters = super(DocumentsQuery, self).get_filters()
        filters.append({
            'term': {'schemata': Document.SCHEMA}
        })
        return filters


class MatchQuery(EntitiesQuery):
    """Given an entity, find the most similar other entities."""

    def __init__(self, parser, entity=None):
        self.entity = entity
        super(MatchQuery, self).__init__(parser)

    def get_query(self):
        query = super(MatchQuery, self).get_query()
        return match_query(self.entity, query=query)


class CollectionsQuery(AuthzQuery):
    TEXT_FIELDS = ['label^3', 'text']
    SORT_DEFAULT = ['_score', {'label.kw': 'asc'}]

    def get_index(self):
        return collections_index()


class RecordsQueryResult(SearchQueryResult):

    def __init__(self, request, parser, result, schema=None):
        super(RecordsQueryResult, self).__init__(request, parser, result,
                                                 schema=schema)
        ids = [res.get('id') for res in self.results]
        for record in DocumentRecord.find_records(ids):
            for result in self.results:
                if result['id'] == str(record.id):
                    if record.data:
                        result['data'] = record.data
                    if record.text:
                        result['text'] = record.text


class RecordsQuery(Query):
    RESULT_CLASS = RecordsQueryResult
    EXCLUDE_FIELDS = ['text']
    TEXT_FIELDS = ['text']
    SORT_DEFAULT = [{'index': 'asc'}]

    def __init__(self, parser, document=None):
        super(RecordsQuery, self).__init__(parser)
        self.document = document

    def get_index(self):
        return records_read_index()

    def get_query(self):
        query = super(RecordsQuery, self).get_query()
        query['bool']['filter'].append({
            'term': {'document_id': self.document.id}
        })
        return query
