from elasticsearch.helpers import scan

from aleph.core import es, es_index
from aleph.index import TYPE_RECORD
from aleph.util import ensure_list
from aleph.search.fragments import text_query_string
from aleph.search.util import execute_basic

SNIPPET_SIZE = 100


def records_query(document_id, state, size=5):
    shoulds = records_query_shoulds(state)
    query = records_query_internal(document_id, shoulds, size=size)
    query['size'] = state.limit
    query['from'] = state.offset
    return query


def records_query_shoulds(state):
    shoulds = []
    if state.has_text:
        shoulds.append(text_query_string(state.text))

    for term in state.highlight_terms:
        shoulds.append(text_query_string(term))
    return shoulds


def records_query_internal(document_id, shoulds, size=5):
    return {
        'size': size,
        'query': {
            'bool': {
                'minimum_should_match': 1,
                'should': shoulds,
                'must': [
                    {'term': {'document_id': document_id}}
                ]
            }
        },
        'highlight': {
            'fields': {
                'text': {
                    'fragment_size': SNIPPET_SIZE,
                    'number_of_fragments': 1
                }
            }
        },
        '_source': ['document_id', 'sheet', 'row_id', 'page']
    }


def scan_entity_mentions(entity):
    """Find mentions of a given entity in all records."""
    shoulds = []
    for term in entity.regex_terms:
        shoulds.append(text_query_string(term))

    query = {
        'query': {
            'bool': {
                'should': shoulds,
                'minimum_should_match': 1
            }
        },
        'sort': [{'document_id': 'desc'}],
        '_source': ['document_id', 'text']
    }
    for res in scan(es, query=query, index=es_index, doc_type=[TYPE_RECORD]):
        for text in ensure_list(res.get('_source').get('text')):
            yield (res.get('_source').get('document_id'), text)


def execute_records_query(query):
    """Execute a query against records and return a set of results."""
    result, hits, output = execute_basic(TYPE_RECORD, query)
    for rec in hits.get('hits', []):
        record = rec.get('_source')
        record['score'] = rec.get('_score')
        for text in rec.get('highlight', {}).get('text', []):
            record['text'] = text
        output['results'].append(record)
    return output
