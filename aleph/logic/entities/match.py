import logging
import fingerprints
from pprint import pprint  # noqa
from banal import ensure_list
from followthemoney.types import registry

from aleph.index.util import bool_query, none_query

log = logging.getLogger(__name__)

REQUIRED = [registry.name, registry.iban, registry.identifier]


def _make_queries(prop, value):
    specificity = prop.type.specificity(value)
    if specificity == 0:
        return

    if prop.type == registry.name:
        boost = (1 + specificity) * 2
        yield {
            'match': {
                'names.text': {
                    'query': value,
                    'operator': 'and',
                    'minimum_should_match': '60%',
                    'boost': boost
                }
            }
        }
        fp = fingerprints.generate(value)
        if fp is not None:
            yield {
                'term': {
                    'fingerprints': {
                        'value': fp,
                        'boost': boost
                    }
                }
            }
        return

    if prop.type.group is None:
        return
    yield {
        'term': {
            prop.type.group: {
                'value': value,
                'boost': specificity
            }
        }
    }


def match_query(proxy, collection_ids=None, query=None):
    """Given a document or entity in indexed form, build a query that
    will find similar entities based on a variety of criteria."""
    if query is None:
        query = bool_query()

    # Don't match the query entity:
    if proxy.id is not None:
        sq = {"ids": {"values": [proxy.id]}}
        query['bool']['must_not'].append(sq)

    collection_ids = ensure_list(collection_ids)
    if len(collection_ids):
        query['bool']['filter'].append({
            'terms': {'collection_id': collection_ids}
        })

    required = []
    scoring = []
    for (prop, value) in proxy.itervalues():
        queries = list(_make_queries(prop, value))
        if prop.type in REQUIRED:
            required.extend(queries)
        else:
            scoring.extend(queries)

    if not len(required):
        # e.g. a document from which no features have been extracted.
        return none_query()

    # make it mandatory to have at least one match
    query['bool']['must'].append({
        'bool': {
            'should': [required],
            'minimum_should_match': 1
        }
    })
    query['bool']['should'].extend(scoring)
    return query
