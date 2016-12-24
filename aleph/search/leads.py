import logging

from aleph.core import es, es_index
from aleph.index import TYPE_LEAD, TYPE_ENTITY
from aleph.search.util import execute_basic
from aleph.search.fragments import filter_query, authz_filter, aggregate
from aleph.search.entities import facet_collections
from aleph.search.facet import parse_facet_result

log = logging.getLogger(__name__)


def leads_query(collection_id, state):
    q = {'term': {'entity_collection_id': collection_id}}
    q = authz_filter(q, state.authz, roles=True)
    aggs = {'scoped': {'global': {}, 'aggs': {}}}
    facets = list(state.facet_names)
    if 'collections' in facets:
        aggs = facet_collections(state, q, aggs)
        facets.remove('collections')
    aggs = aggregate(state, q, aggs, facets)

    q = {
        'sort': [{'judgement': 'asc'}, {'score': 'desc'}, {'match_id': 'asc'}],
        'query': filter_query(q, state.filters),
        'aggregations': aggs,
        'size': state.limit,
        'from': state.offset
    }
    result, hits, output = execute_basic(TYPE_LEAD, q)
    output['facets'] = parse_facet_result(state, result)
    entities = set([])
    for doc in hits.get('hits', []):
        link = doc.get('_source')
        link['id'] = doc.get('_id')
        entities.add(link.get('entity_id'))
        entities.add(link.get('match_id'))
        output['results'].append(link)

    q = {'terms': {'_id': list(entities)}}
    q = {'query': q, 'size': len(entities) + 2}
    _, hits, _ = execute_basic(TYPE_ENTITY, q)
    for doc in hits.get('hits', []):
        entity = doc.get('_source')
        entity['id'] = doc.get('_id')
        for result in output['results']:
            if result.get('match_id') == entity['id']:
                result['match'] = entity
            if result.get('entity_id') == entity['id']:
                result['entity'] = entity
    return output


def lead_count(collection_id):
    """Inaccurate, as it does not reflect auth."""
    q = {'term': {'entity_collection_id': collection_id}}
    q = {'size': 0, 'query': q}
    result = es.search(index=es_index, doc_type=TYPE_LEAD, body=q)
    return result.get('hits', {}).get('total', 0)
