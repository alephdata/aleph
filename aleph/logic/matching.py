import logging
import fingerprints
from pprint import pprint  # noqa
from banal import ensure_list
from followthemoney.types import registry

from aleph.index.util import bool_query, none_query

log = logging.getLogger(__name__)

MAX_CLAUSES = 500
REQUIRED = [registry.name, registry.iban, registry.identifier]


def _make_queries(prop, value, specificity):
    if prop.type == registry.name:
        boost = (1 + specificity) * 2
        yield {
            'match': {
                'fingerprints.text': {
                    'query': value,
                    'operator': 'and',
                    'minimum_should_match': '60%',
                    'boost': boost
                }
            }
        }
        fp = fingerprints.generate(value)
        if fp is not None and fp != value:
            yield {
                'match': {
                    'fingerprints.text': {
                        'query': value,
                        'operator': 'and',
                        'minimum_should_match': '60%',
                        'boost': boost
                    }
                }
            }
    elif prop.type.group is not None:
        yield {
            'term': {
                prop.type.group: {
                    'value': value
                }
            }
        }


def match_query(proxy, source_collection_id=None, collection_ids=None,
                query=None):
    """Given a document or entity in indexed form, build a query that
    will find similar entities based on a variety of criteria."""
    if query is None:
        query = bool_query()

    # Don't match the query entity and source collection_id:
    must_not = []
    if proxy.id is not None:
        must_not.append({"ids": {"values": [proxy.id]}})
    if source_collection_id is not None:
        must_not.append({'term': {'collection_id': source_collection_id}})
    if len(must_not):
        query['bool']['must_not'].extend(must_not)

    collection_ids = ensure_list(collection_ids)
    if len(collection_ids):
        query['bool']['filter'].append({
            'terms': {'collection_id': collection_ids}
        })

    filters = []
    for (prop, value) in proxy.itervalues():
        specificity = prop.specificity(value)
        if specificity > 0:
            filters.append((prop, value, specificity))

    filters = sorted(filters, key=lambda p: p[2], reverse=True)
    required = []
    for (prop, value, specificity) in filters:
        if prop.type in REQUIRED and len(required) <= MAX_CLAUSES:
            required.extend(_make_queries(prop, value, specificity))

    scoring = []
    for (prop, value, specificity) in filters:
        clauses = len(required) + len(scoring)
        if prop.type not in REQUIRED and clauses <= MAX_CLAUSES:
            scoring.extend(_make_queries(prop, value, specificity))

    if not len(required):
        # e.g. a document from which no features have been extracted.
        return none_query()

    # make it mandatory to have at least one match
    query['bool']['must'].append({
        'bool': {
            'should': required,
            'minimum_should_match': 1
        }
    })
    query['bool']['should'].extend(scoring)
    return query
