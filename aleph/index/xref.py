import logging

from aleph.core import schemata
from aleph.model import Document

log = logging.getLogger(__name__)


def entity_query(sample, query=None):
    """Given a document or entity in indexed form, build a query that
    will find similar entities based on a variety of criteria."""

    # Do not attempt to find xrefs for entity types such as land, buildings,
    # etc.
    schema = schemata.get(sample.get('schema'))
    if sample.get('schema') != Document.SCHEMA and not schema.fuzzy:
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

    for fp in sample.get('fingerprints', []):
        required.append({
            'match': {
                'fingerprints': {
                    'query': fp,
                    'fuzziness': 2,
                    'operator': 'and',
                    'boost': 3.0
                }
            }
        })

    for index in ['names', 'fingerprints']:
        for value in sample.get(index, []):
            required.append({
                'match': {
                    index: {
                        'query': value,
                        'operator': 'and'
                    }
                }
            })

    for index in ['emails', 'phones']:
        for value in sample.get(index, []):
            required.append({
                'match': {
                    index: {
                        'query': value,
                        'fuzziness': 2,
                        'operator': 'and',
                        'boost': 2
                    }
                }
            })

    if not len(required):
        # e.g. a document from which no features have been extracted.
        return {'match_none': {}}

    # make it mandatory to have either a fingerprint or name match
    query['bool']['must'].append({
        "bool": {
            "should": required,
            "minimum_should_match": 1
        }
    })

    # boost by "contributing criteria"
    for field in ['dates', 'countries', 'schemata', 'identifiers']:
        for val in sample.get(field, []):
            query['bool']['should'].append({
                'term': {field: val}
            })

    for val in sample.get('addresses', []):
        query['bool']['should'].append({
            'common': {
                field: {
                    'query': val
                }
            }
        })

    # filter types which cannot be resolved via fuzzy matching.
    query['bool']['must_not'].append([
        {"ids": {"values": [sample.get('id')]}},
        {"terms": {"schema": [s.name for s in schemata if not s.fuzzy]}}
    ])
    return query
