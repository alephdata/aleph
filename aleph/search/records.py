from aleph.index import TYPE_RECORD
from aleph.search.fragments import text_query_string
from aleph.search.util import execute_basic
from aleph.search.fragments import match_all, filter_query
from aleph.model import DocumentRecord

SNIPPET_SIZE = 100


def records_query(document_id, state):
    rows = state.getintlist('row')
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
