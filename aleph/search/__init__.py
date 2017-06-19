import logging

from aleph.core import es, es_index, schemata
from aleph.model import DocumentRecord
from aleph.index.mapping import TYPE_DOCUMENT, TYPE_RECORD  # noqa
from aleph.index.mapping import TYPE_COLLECTION, TYPE_LINK  # noqa
from aleph.index.mapping import TYPE_ENTITY, TYPE_LEAD  # noqa

from aleph.search.parser import QueryParser, SearchQueryParser  # noqa
from aleph.search.result import QueryResult, DatabaseQueryResult  # noqa
from aleph.search.result import SearchQueryResult  # noqa
from aleph.search.query import AuthzQuery

log = logging.getLogger(__name__)


class DocumentsQuery(AuthzQuery):
    DOC_TYPES = [TYPE_DOCUMENT]
    TEXT_FIELDS = ['title^3', 'summary', 'text', '_all']
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

    def __init__(self, parser, entity=None):
        super(EntityDocumentsQuery, self).__init__(parser)
        self.entity = entity

    def get_query(self):
        query = super(EntityDocumentsQuery, self).get_query()
        if self.entity is None:
            return query

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


class AlertDocumentsQuery(EntityDocumentsQuery):
    """Find documents matching an alert criterion."""

    def __init__(self, parser, entity=None, since=None):
        super(AlertDocumentsQuery, self).__init__(parser, entity=entity)
        self.since = since

    def get_highlight(self):
        return {
            'fields': {
                'text': {},
                'summary': {},
            }
        }

    def get_query(self):
        query = super(EntityDocumentsQuery, self).get_query()
        if self.since is not None:
            query['bool']['filter'].append({
                "range": {
                    "created_at": {
                        "gt": self.since
                    }
                }
            })
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


class SimilarEntitiesQuery(EntitiesQuery):
    """Given an entity, find the most similar other entities."""

    def __init__(self, parser, entity=None):
        super(SimilarEntitiesQuery, self).__init__(parser)
        self.entity = entity

    def get_multi_match(self, text, fields):
        return {
            'multi_match': {
                "fields": fields,
                "query": text,
                "fuzziness": 1,
                "operator": "AND"
            }
        }

    def get_query(self):
        query = super(SimilarEntitiesQuery, self).get_query()
        schema = schemata.get(self.entity.get('schema'))
        if not schema.fuzzy:
            return {'match_none': {}}

        required = []
        # search for fingerprints
        for fp in self.entity.get('fingerprints', []):
            required.append(self.get_multi_match(fp, ['fingerprints']))

        if not self.parser.getbool('strict', False):
            # broaden search to similar names
            for name in self.entity.get('names', []):
                required.append(self.get_multi_match(name, ['names', 'text']))

        # make it mandatory to have either a fingerprint or name match
        query['bool']['must'].append({
            "bool": {
                "should": required,
                "minimum_should_match": 1
            }
        })

        # boost by "contributing criteria"
        for field in ['dates', 'countries', 'addresses', 'schemata']:
            for val in self.entity.get(field, []):
                fq = self.get_multi_match(val, [field])
                query['bool']['should'].append(fq)

        # filter types which cannot be resolved via fuzzy matching.
        query['bool']['must_not'].append({
            "ids": {
                "values": [self.entity.get('id')]
            },
            "terms": {
                "schema": [s.name for s in schemata if not s.fuzzy]
            }
        })
        return query


class SuggestEntitiesQuery(EntitiesQuery):
    """Given a text prefix, find the most similar other entities."""
    RETURN_FIELDS = ['name', 'schema', 'fingerprints', '$documents']
    SORT = {
        'default': ['_score', {'$documents': 'desc'}, {'name_sort': 'asc'}]
    }

    def __init__(self, parser):
        super(SuggestEntitiesQuery, self).__init__(parser)

    def get_query(self):
        query = super(SuggestEntitiesQuery, self).get_query()
        query['bool']['must'] = [{
            'match_phrase_prefix': {
                'names': self.parser.prefix
            }
        }]

        # filter types which cannot be resolved via fuzzy matching.
        query['bool']['must_not'].append({
            "terms": {
                "schema": [s.name for s in schemata if not s.fuzzy]
            }
        })
        return query


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
            return self.SORT.get('score')
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
