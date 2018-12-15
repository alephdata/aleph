import logging
import fingerprints
from followthemoney.types import registry

from aleph.model import Entity
from aleph.index.util import bool_query, none_query

log = logging.getLogger(__name__)


def match_query(proxy, collection_ids=None, query=None):
    """Given a document or entity in indexed form, build a query that
    will find similar entities based on a variety of criteria."""
    if query is None:
        query = bool_query()

    # Don't match the query entity:
    if proxy.id:
        sq = {"ids": {"values": [proxy.id]}}
        query['bool']['must_not'].append(sq)

    # Attempt to find only matches within the "matchable" set of
    # entity schemata. For example, a Company and be matched to
    # another company or a LegalEntity, but not a Person.
    # Real estate is "unmatchable", i.e. even if two plots of land
    # have almost the same name and criteria, it does not make
    # sense to suggest they are the same.
    if proxy.schema.name != Entity.THING:
        matchable = [s.name for s in proxy.schema.matchable_schemata]
        if not len(matchable):
            return none_query()

        query['bool']['must'].append({
            "terms": {"schema": matchable}
        })

    if collection_ids is not None:
        query['bool']['must'].append({
            'terms': {'collection_id': collection_ids}
        })

    required = []
    for name in proxy.names:
        required.append({
            'match': {
                'names.text': {
                    'query': name,
                    'operator': 'and',
                    'minimum_should_match': '60%',
                }
            }
        })
        fp = fingerprints.generate(name)
        if fp is not None:
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

    for type_ in registry.types:
        if not type_.strong or type_.group is None:
            continue
        for value in proxy.get_type_values(type_):
            required.append({
                'term': {
                    type_.group: {
                        'value': value,
                        'boost': 3.0
                    }
                }
            })

    if not len(required):
        # e.g. a document from which no features have been extracted.
        return none_query()

    # make it mandatory to have at least one match
    query['bool']['must'].append({
        "bool": {
            "should": required,
            "minimum_should_match": 1
        }
    })
    return query
