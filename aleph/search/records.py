from aleph.model import Entity
from aleph.index import TYPE_RECORD
from aleph.core import es, es_index, url_for


def records_query(document_id, args, size=5):
    terms = []
    text = args.get('q', '').strip()
    if len(text):
        terms.append(text)

    entities = Entity.by_id_set(args.getlist('entity'))
    for entity in entities.values():
        terms.extend(entity.terms)

    if not len(terms):
        return None

    shoulds = []
    for term in terms:
        shoulds.append({
            'query_string': {
                'query': text,
                'fields': ['text^10', 'text_latin'],
                'default_operator': 'AND',
                'use_dis_max': True
            }
        })

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

    try:
        snippet = int(args.get('snippet', 50))
    except:
        snippet = 50

    return {
        'size': size,
        'query': q,
        'highlight': {
            'fields': {
                'text': {'fragment_size': snippet},
                'text_latin': {'fragment_size': snippet}
            }
        },
        '_source': ['document_id', 'sheet', 'row_id', 'page']
    }


def execute_records_query(document_id, args, query):
    """ Execute a query against records and return a set of results. """
    result = es.search(index=es_index, doc_type=TYPE_RECORD, body=query)
    hits = result.get('hits', {})
    output = {
        'status': 'ok',
        'results': [],
        'offset': query['from'],
        'limit': query['size'],
        'total': hits.get('total'),
        'next': None
    }
    next_offset = output['offset'] + output['limit']
    if output['total'] > next_offset:
        params = {'offset': next_offset}
        for k, v in args.iterlists():
            if k in ['offset']:
                continue
            params[k] = v
        output['next'] = url_for('search.record',
                                 document_id=document_id,
                                 **params)

    for rec in hits.get('hits', []):
        record = rec.get('_source')
        record['score'] = rec.get('_score')
        record['text'] = rec.get('highlight', {}).get('text')
        output['results'].append(record)
    return output
