from elasticsearch.helpers import scan

from aleph.core import get_es, get_es_index
from aleph.model import Entity
from aleph.index import TYPE_RECORD
from aleph.search.fragments import text_query_string
from aleph.search.util import execute_basic

SNIPPET_SIZE = 100


def records_query(document_id, args, size=5):
    query_text = args.get('q', '')
    entities = Entity.by_id_set(args.getlist('entity'))
    return records_query_internal(document_id, query_text,
                                  entities, size=size)


def records_query_internal(document_id, query_text, entities, size=5):
    shoulds = []
    query_text = query_text.strip()
    if len(query_text):
        shoulds.append(text_query_string(query_text))

    for entity in entities.values():
        for term in entity.terms:
            shoulds.append({
                'multi_match': {
                    'query': term,
                    'type': "best_fields",
                    'fields': ['text^5', 'text_latin'],
                    'operator': 'AND'
                }
            })

    if not len(shoulds):
        return None

    q = {
        'bool': {
            'minimum_should_match': 1,
            'should': shoulds
        }
    }
    if document_id is not None:
        q['bool']['must'] = {
            'term': {'document_id': document_id}
        }
    return {
        'size': size,
        'query': q,
        'highlight': {
            'fields': {
                'text': {
                    'fragment_size': SNIPPET_SIZE,
                    'number_of_fragments': 1
                },
                'text_latin': {
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
            'bool': {'should': shoulds, "minimum_should_match": 1}
        },
        'sort': [{'document_id': 'desc'}],
        '_source': ['document_id', 'text']
    }
    for res in scan(get_es(), query=query, index=get_es_index(),
                    doc_type=[TYPE_RECORD]):
        text = res.get('_source').get('text')
        texts = text if isinstance(text, list) else [text]
        for text in texts:
            yield (res.get('_source').get('document_id'), text)


def execute_records_query(query):
    """Execute a query against records and return a set of results."""
    result, hits, output = execute_basic(TYPE_RECORD, query)
    for rec in hits.get('hits', []):
        record = rec.get('_source')
        record['score'] = rec.get('_score')
        record['text'] = rec.get('highlight', {}).get('text')
        output['results'].append(record)
    return output
