import logging
import fingerprints
from pprint import pprint  # noqa
from banal import ensure_list
from followthemoney.types import registry

from aleph.index.util import bool_query, none_query

log = logging.getLogger(__name__)

MAX_CLAUSES = 500
REQUIRED = [registry.name, registry.iban, registry.identifier]


def _make_queries(type_, value):
    if type_ == registry.name:
        yield {
            "match": {
                "fingerprints.text": {
                    "query": value,
                    "operator": "and",
                    "minimum_should_match": "60%",
                }
            }
        }
        fp = fingerprints.generate(value)
        if fp is None:
            return
        if fp.lower() != value.lower():
            yield {
                "match": {
                    "fingerprints.text": {
                        "query": fp,
                        "operator": "and",
                        "minimum_should_match": "60%",
                    }
                }
            }
    elif type_.group is not None:
        yield {"term": {type_.group: {"value": value}}}


def match_query(proxy, collection_ids=None, query=None):
    """Given a document or entity in indexed form, build a query that
    will find similar entities based on a variety of criteria."""
    if query is None:
        query = bool_query()

    # Don't match the query entity and source collection_id:
    must_not = []
    if proxy.id is not None:
        must_not.append({"ids": {"values": [proxy.id]}})
    # if source_collection_id is not None:
    #     must_not.append({'term': {'collection_id': source_collection_id}})
    if len(must_not):
        query["bool"]["must_not"].extend(must_not)

    collection_ids = ensure_list(collection_ids)
    if len(collection_ids):
        query["bool"]["filter"].append({"terms": {"collection_id": collection_ids}})

    filters = set()
    for prop, value in proxy.itervalues():
        specificity = prop.specificity(value)
        if specificity > 0:
            filters.add((prop.type, value, specificity))

    filters = sorted(filters, key=lambda p: p[2], reverse=True)
    required = []
    for type_, value, _ in filters:
        if type_ in REQUIRED and len(required) <= MAX_CLAUSES:
            required.extend(_make_queries(type_, value))

    scoring = []
    for type_, value, _ in filters:
        clauses = len(required) + len(scoring)
        if type_ not in REQUIRED and clauses <= MAX_CLAUSES:
            scoring.extend(_make_queries(type_, value))

    if not len(required):
        # e.g. a document from which no features have been extracted.
        return none_query()

    # make it mandatory to have at least one match
    query["bool"]["must"].append(
        {"bool": {"should": required, "minimum_should_match": 1}}
    )
    query["bool"]["should"].extend(scoring)
    return query
