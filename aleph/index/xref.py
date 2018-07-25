import logging
from banal import ensure_list
from followthemoney import model

log = logging.getLogger(__name__)
NO_QUERY = {'match_none': {}}


def entity_query(sample, collection_id=None, query=None, broad=False):
    """Given a document or entity in indexed form, build a query that
    will find similar entities based on a variety of criteria."""
    schema = model.get(sample.get('schema'))
    if schema is None:
        return NO_QUERY

    if query is None:
        query = {
            'bool': {
                'should': [],
                'filter': [],
                'must': [],
                'must_not': []
            }
        }

    # Don't match the query entity:
    if sample.get('id'):
        sq = {"ids": {"values": [sample.get('id')]}}
        query['bool']['must_not'].append(sq)

    if not broad:
        # Attempt to find only matches within the "matchable" set of
        # entity schemata. For example, a Company and be matched to
        # another company or a LegalEntity, but not a Person.
        # Real estate is "unmatchable", i.e. even if two plots of land
        # have almost the same name and criteria, it does not make
        # sense to suggest they are the same.
        matchable = [s.name for s in schema.matchable_schemata]
        if not len(matchable):
            return NO_QUERY
        query['bool']['must'].append({"terms": {"schema": matchable}})

    if collection_id is not None:
        query['bool']['must'].append({
            'term': {'collection_id': collection_id}
        })

    required = []
    for fp in ensure_list(sample.get('fingerprints'))[:50]:
        required.append({
            'match': {
                'fingerprints': {
                    'query': fp,
                    'fuzziness': 1,
                    'operator': 'and',
                    'boost': 3.0
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
        return NO_QUERY

    # make it mandatory to have either a fingerprint or name match
    query['bool']['must'].append({
        "bool": {
            "should": required,
            "minimum_should_match": 1
        }
    })

    # boost by "contributing criteria"
    for field in ['dates', 'countries', 'identifiers']:
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

    # if sample.get('content_hash'):
    #     # Do not try to find other copies of the same document
    #     query['bool']['must_not'].append({
    #         "term": {"schema": sample.get('content_hash')}
    #     })
    return query
