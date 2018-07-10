import logging
from banal import ensure_list
from followthemoney import model

# from aleph.model import Document

log = logging.getLogger(__name__)


def entity_query(sample, collection_id=None, query=None, broad=False):
    """Given a document or entity in indexed form, build a query that
    will find similar entities based on a variety of criteria."""

    # Do not attempt to find xrefs for entity types such as land, buildings,
    # etc.
    schema = model.get(sample.get('schema'))
    if schema is None:
        return {'match_none': {}}
    if not broad and not schema.fuzzy:
        return {'match_none': {}}

    if query is None:
        query = {
            'bool': {
                'should': [],
                'filter': [],
                'must': [],
                'must_not': []
            }
        }

    required = []
    for fp in ensure_list(sample.get('fingerprints'))[:50]:
        required.append({
            'match': {
                'fingerprints': {
                    'query': fp,
                    'fuzziness': 1,
                    'operator': 'and',
                    'boost': 2.0
                }
            }
        })

    for name in ensure_list(sample.get('names'))[:50]:
        required.append({
            'match': {
                'names.text': {
                    'query': name,
                    'operator': 'and',
                    'minimum_should_match': '67%',
                    # 'cutoff_frequency': 0.0001,
                    # 'boost': 0.5
                }
            }
        })

    for index in ['emails', 'phones']:
        for value in ensure_list(sample.get(index)):
            if value is None or not len(value):
                continue
            required.append({
                'term': {
                    index: {
                        'value': value,
                        'boost': 5.0
                    }
                }
            })

    if not len(required):
        # e.g. a document from which no features have been extracted.
        return {'match_none': {}}

    if collection_id is not None:
        query['bool']['must'].append({
            'term': {'collection_id': collection_id}
        })

    # make it mandatory to have either a fingerprint or name match
    query['bool']['must'].append({
        "bool": {
            "should": required,
            "minimum_should_match": 1
        }
    })

    # boost by "contributing criteria"
    for field in ['dates', 'countries', 'schemata', 'identifiers']:
        for value in ensure_list(sample.get(field)):
            if value is None or not len(value):
                continue
            query['bool']['should'].append({
                'term': {
                    field: {
                        'value': value,
                        'boost': 0.5
                    }
                }
            })

    for value in ensure_list(sample.get('addresses')):
        if value is None or not len(value):
                continue
        query['bool']['should'].append({
            'common': {field: {'query': value}}
        })

    # filter types which cannot be resolved via fuzzy matching.
    query['bool']['must_not'].extend([
        {"ids": {"values": [sample.get('id')]}},
        {"terms": {"schema": [s.name for s in model if not s.fuzzy]}}
    ])
    if sample.get('content_hash'):
        # Do not try to find other copies of the same document
        query['bool']['must_not'].append({
            "term": {"schema": sample.get('content_hash')}
        })
    return query
