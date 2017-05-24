from elasticsearch.helpers import scan

from aleph.core import es, es_index
from aleph.index import TYPE_RECORD
from aleph.util import ensure_list
from aleph.search.fragments import text_query_string
from aleph.search.util import execute_basic
from aleph.search.fragments import match_all, filter_query
from aleph.model import DocumentRecord

SNIPPET_SIZE = 100


def records_query(document_id, state):
    try:
        rows = [int(r) for r in state.getlist('row')]
    except:
        rows = []

    score_query = state.has_text or len(rows)
    shoulds = records_query_shoulds(state)
    if not len(shoulds):
        shoulds = [match_all()]

    if len(rows):
        shoulds.append({
            "constant_score": {
                "filter": {'terms': {'index': rows}},
                "boost": 1000
            }
        })

    query = records_query_internal(document_id, shoulds, size=state.limit)
    query['query'] = filter_query(query['query'], state.filters)
    query['from'] = state.offset

    sort = [{'index': 'asc'}, {'page': 'asc'}]
    if score_query:
        sort.insert(0, '_score')
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
                'filter': [{'term': {'document_id': document_id}}]
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
        '_source': ['document_id', 'sheet', 'index']
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


def execute_records_query(document_id, state, query):
    """Execute a query against records and return a set of results."""
    result, hits, output = execute_basic(TYPE_RECORD, query)
    ids = []
    for rec in hits.get('hits', []):
        record = rec.get('_source')
        record['score'] = rec.get('_score')
        record['id'] = int(rec.get('_id'))
        ids.append(rec.get('_id'))
        for text in rec.get('highlight', {}).get('text', []):
            record['text'] = text
        output['results'].append(record)

    for record in DocumentRecord.find_records(document_id, ids):
        for result in output['results']:
            if result['id'] == record.id:
                result['data'] = record.data
                result['text'] = record.text
    return output
