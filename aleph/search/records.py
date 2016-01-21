from aleph.model import Entity
from aleph.util import latinize_text


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
            'match': {
                'text': {
                    'query': term,
                    'boost': 10,
                    'operator': 'and'
                }
            }
        })
        shoulds.append({
            'match': {
                'text_latin': {
                    'query': latinize_text(term),
                    'operator': 'and'
                }
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

    return {
        'size': size,
        'query': q,
        'highlight': {
            'fields': {
                'text': {},
                'text_latin': {}
            }
        },
        '_source': ['document_id', 'sheet', 'row_id', 'page']
    }
