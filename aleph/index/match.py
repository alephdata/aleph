import logging
import fingerprints
from pprint import pprint  # noqa
from banal import ensure_list
from followthemoney.types import registry

from aleph.model import Entity
from aleph.index.util import bool_query, none_query

log = logging.getLogger(__name__)

REQUIRED = [registry.name, registry.iban, registry.identifier]


def _make_queries(prop, value):
    specificity = prop.type.specificity(value)
    if specificity == 0:
        return

    if prop.type == registry.name:
        yield {
            'match': {
                'names.text': {
                    'query': value,
                    'operator': 'and',
                    'minimum_should_match': '60%',
                    'boost': 2 * specificity
                }
            }
        }
        fp = fingerprints.generate(value)
        if fp is not None:
            yield {
                'match': {
                    'fingerprints': {
                        'query': fp,
                        # 'fuzziness': 1,
                        'operator': 'and',
                        'minimum_should_match': '60%',
                        'boost': 2 * specificity
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

        query['bool']['filter'].append({
            "terms": {"schema": matchable}
        })

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
