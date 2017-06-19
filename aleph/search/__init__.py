import logging

from aleph.core import es, es_index
from aleph.model import DocumentRecord
from aleph.index.mapping import TYPE_DOCUMENT, TYPE_RECORD  # noqa
from aleph.index.mapping import TYPE_COLLECTION, TYPE_LINK  # noqa
from aleph.index.mapping import TYPE_ENTITY, TYPE_LEAD  # noqa
from aleph.search.entities import suggest_entities, similar_entities  # noqa
from aleph.search.entities import load_entity  # noqa

from aleph.search.parser import QueryParser  # noqa
from aleph.search.result import QueryResult, DatabaseQueryResult  # noqa
from aleph.search.result import SearchQueryResult  # noqa
from aleph.search.query import AuthzQuery

log = logging.getLogger(__name__)


class DocumentsQuery(AuthzQuery):
    DOC_TYPES = [TYPE_DOCUMENT]
    RETURN_FIELDS = ['collection_id', 'title', 'file_name', 'extension',
                     'languages', 'countries', 'source_url', 'created_at',
                     'updated_at', 'type', 'summary', 'status', 'error_type',
                     'error_message']
    SORT = {
        'default': ['_score', {'name_sort': 'asc'}],
        'name': [{'name_sort': 'asc'}, '_score'],
    }


class EntityDocumentsQuery(DocumentsQuery):
    """Find documents that mention an entity."""

    def get_query(self):
        query = super(EntityDocumentsQuery, self).get_query()
        names = self.entity.get('names', [])
        names.extend(self.entity.get('fingerprints', []))

        for name in names:
            for field in ['title', 'summary', 'text']:
                query['bool']['should'].append({
                    'match_phrase': {
                        field: {
                            'query': name,
                            'slop': 3
                        }
                    }
                })

        # TODO: add in other entity info like phone numbers, addresses, etc.
        query['bool']['minimum_should_match'] = 1
        return query


class EntitiesQuery(AuthzQuery):
    DOC_TYPES = [TYPE_ENTITY]
    RETURN_FIELDS = ['collection_id', 'roles', 'name', 'data', 'countries',
                     'schema', 'schemata', 'properties', 'fingerprints',
                     'state']
    SORT = {
        'default': ['_score', {'$documents': 'desc'}, {'name_sort': 'asc'}],
        'name': [{'name_sort': 'asc'}, {'$documents': 'desc'}, '_score'],
        'documents': [{'$documents': 'desc'}, {'name_sort': 'asc'}, '_score']
    }


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


class LeadsQueryResult(SearchQueryResult):
    """Leads only include entity IDs, this will expand them into entities."""

    def __init__(self, request, parser, result):
        super(LeadsQueryResult, self).__init__(request, parser, result)
        ids = [res.get('id') for res in self.results]
        ids = {'ids': list(set(ids))}
        result = es.mget(index=es_index, doc_type=TYPE_ENTITY, body=ids)
        for doc in result.get('docs', []):
            if not doc.get('found', False):
                continue
            entity = doc.get('_source')
            entity['id'] = doc.get('_id')
            for result in self.results:
                if result.get('match_id') == entity['id']:
                    result['match'] = entity
                if result.get('entity_id') == entity['id']:
                    result['entity'] = entity


class LeadsQuery(AuthzQuery):
    DOC_TYPES = [TYPE_LEAD]
    RESULT_CLASS = LeadsQueryResult

    def __init__(self, parser, collection_id=None):
        super(LinksQuery, self).__init__(parser)
        self.collection_id = collection_id

    def get_query(self):
        return {
            'term': {
                'entity_collection_id': self.collection_id
            }
        }


class RecordsQueryResult(SearchQueryResult):

    def __init__(self, request, parser, result):
        super(RecordsQueryResult, self).__init__(request, parser, result)
        ids = [res.get('id') for res in self.results]
        for record in DocumentRecord.find_records(ids):
            for result in self.results:
                if result['id'] == record.id:
                    result['data'] = record.data
                    result['text'] = record.text


class RecordsQuery(AuthzQuery):
    DOC_TYPES = [TYPE_RECORD]
    RESULT_CLASS = RecordsQueryResult
    RETURN_FIELDS = ['document_id', 'sheet', 'index']
    TEXT_FIELDS = ['text^2', '_all']
    SORT = {
        'default': [{'index': 'asc'}],
        'score': ['_score', {'index': 'asc'}],
    }

    def __init__(self, parser, document=None):
        super(RecordsQuery, self).__init__(parser)
        self.document = document
        self.rows = parser.getintlist('row')

    def get_sort(self):
        if len(self.rows) or self.parser.text:
            return self.SORTS.get('score')
        return super(RecordsQuery, self).get_sort()

    def get_highlight(self):
        return {
            'fields': {
                'text': {
                    'number_of_fragments': 1
                }
            }
        }

    def get_query(self):
        query = super(RecordsQuery, self).get_query()
        query['bool']['filter'].append({
            'term': {
                'document_id': self.document.id
            }
        })
        if len(self.rows):
            query['bool']['should'].append({
                "constant_score": {
                    "filter": {'terms': {'index': self.rows}},
                    "boost": 1000
                }
            })
        return query
