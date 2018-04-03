import logging
from followthemoney import model

from aleph.model import Document, DocumentRecord
from aleph.index.xref import entity_query
from aleph.index.core import entities_index
from aleph.index.core import records_index
from aleph.index.core import collections_index
from aleph.search.parser import QueryParser, SearchQueryParser  # noqa
from aleph.search.result import QueryResult, DatabaseQueryResult  # noqa
from aleph.search.result import SearchQueryResult  # noqa
from aleph.search.query import Query, AuthzQuery

log = logging.getLogger(__name__)


class DocumentsQuery(AuthzQuery):
    TEXT_FIELDS = ['name^3', 'names.text^2', 'text']
    EXCLUDE_FIELDS = ['roles', 'text']
    SORT_DEFAULT = ['_score', {'name.kw': 'asc'}]

    def get_filters(self):
        filters = super(DocumentsQuery, self).get_filters()
        filters.append({
            'term': {'schemata': Document.SCHEMA}
        })
        return filters

    def get_index(self):
        return entities_index()


class EntityDocumentsQuery(DocumentsQuery):
    """Find documents that mention an entity."""

    def __init__(self, parser, entity=None):
        super(EntityDocumentsQuery, self).__init__(parser)
        self.entity = entity

    def get_query(self):
        query = super(EntityDocumentsQuery, self).get_query()
        if self.entity is None:
            return query

        fingerprints = self.entity.get('fingerprints', [])

        for fp in fingerprints:
            query['bool']['should'].append({
                'match': {
                    'fingerprints': {
                        'query': fp,
                        'fuzziness': 1,
                        'operator': 'and',
                        'boost': 3.0
                    }
                }
            })

        names = self.entity.get('names', [])
        names.extend(fingerprints)

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
    TEXT_FIELDS = ['name^3', 'names.text^2', 'text']
    EXCLUDE_FIELDS = ['roles', 'text']
    SORT_DEFAULT = ['_score', {'name.kw': 'asc'}]

    def get_query(self):
        query = super(EntitiesQuery, self).get_query()
        # TODO do we need to specify "Thing" here???
        query['bool']['must_not'].append({
            'term': {'schemata': Document.SCHEMA}
        })
        return query

    def get_index(self):
        return entities_index()


class SimilarEntitiesQuery(EntitiesQuery):
    """Given an entity, find the most similar other entities."""

    def __init__(self, parser, entity=None):
        super(SimilarEntitiesQuery, self).__init__(parser)
        self.entity = entity

    def get_query(self):
        query = super(SimilarEntitiesQuery, self).get_query()
        return entity_query(self.entity, query=query)


class SuggestEntitiesQuery(EntitiesQuery):
    """Given a text prefix, find the most similar other entities."""
    INCLUDE_FIELDS = ['name', 'schema', 'fingerprints']

    def __init__(self, parser):
        super(SuggestEntitiesQuery, self).__init__(parser)

    def get_query(self):
        query = super(SuggestEntitiesQuery, self).get_query()
        query['bool']['must'] = [{
            'match_phrase_prefix': {
                'names.text': self.parser.prefix
            }
        }]

        # filter types which cannot be resolved via fuzzy matching.
        query['bool']['must_not'].append({
            "terms": {
                "schema": [s.name for s in model if not s.fuzzy]
            }
        })
        return query


class CombinedQuery(AuthzQuery):
    TEXT_FIELDS = ['title^3', 'name^3', 'names.text^2', 'text']
    EXCLUDE_FIELDS = ['roles', 'text']
    SORT_DEFAULT = ['_score', {'name.kw': 'asc'}]

    def get_index(self):
        return entities_index()


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
        self.rows = parser.getintlist('row')

    def get_index(self):
        return records_index()

    def get_sort(self):
        # if len(self.rows) or self.parser.text:
        #     return [{''}]
        return super(RecordsQuery, self).get_sort()

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
