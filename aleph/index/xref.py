import logging
from followthemoney import model

from aleph.model import Document

log = logging.getLogger(__name__)

FIELDS_XREF = ['schema', 'schemata', 'collection_id', 'name', 'fingerprints',
               'emails', 'phones', 'dates', 'countries', 'schemata',
               'identifiers', 'addresses']


def entity_query(sample, collection_id=None, query=None):
    """Given a document or entity in indexed form, build a query that
    will find similar entities based on a variety of criteria."""

    # Do not attempt to find xrefs for entity types such as land, buildings,
    # etc.
    schema = model.get(sample.get('schema'))
    if schema is None or not schema.fuzzy:
        return {'match_none': {}}
    if Document.COMMON_SCHEMA in schema.names:
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

    if collection_id is not None:
        query['bool']['must'].append({
            'term': {'collection_id': collection_id}
        })

    for fp in sample.get('fingerprints', []):
        required.append({
            'fuzzy': {
                'fingerprints': {
                    'value': fp,
                    'fuzziness': 2,
                    'boost': 3.0
                }
            }
        })

    # TODO: put names in FIELDS_XREF up there ^^^
    # for value in sample.get('names', []):
    #     required.append({
    #         'match': {
    #             'names': {
    #                 'query': value,
    #                 'operator': 'and',
    #                 'cutoff_frequency': 0.01,
    #             }
    #         }
    #     })

    for index in ['emails', 'phones']:
        for value in sample.get(index, []):
            required.append({
                'term': {
                    index: {
                        'value': value,
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
        {"terms": {"schema": [s.name for s in model if not s.fuzzy]}}
    ])
    return query
