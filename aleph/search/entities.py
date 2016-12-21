import json
from pprint import pprint  # noqa

from aleph.core import url_for, es, es_index
from aleph.index import TYPE_ENTITY, TYPE_DOCUMENT
from aleph.search.util import execute_basic
from aleph.search.fragments import match_all, filter_query, multi_match
from aleph.search.fragments import add_filter, aggregate
from aleph.search.facet import parse_facet_result
from aleph.text import latinize_text

DEFAULT_FIELDS = ['collection_id', 'roles', 'dataset', 'name', 'data',
                  'countries', 'schema', 'schemata', 'properties',
                  'fingerprints', 'state']


def entity_authz_filter(q, authz):
    return add_filter(q, {
        "or": [
            {'terms': {'roles': list(authz.roles)}},
            {'terms': {'collection_id': list(authz.collections_read)}},
        ]
    })


def entities_query(state, fields=None, facets=True, doc_counts=False):
    """Parse a user query string, compose and execute a query."""
    if state.has_text:
        q = {
            "query_string": {
                "query": state.text,
                "fields": ['name^5', 'names^2', 'text'],
                "default_operator": "AND",
                "use_dis_max": True
            }
        }
    else:
        q = match_all()

    if state.raw_query:
        q = {"bool": {"must": [q, state.raw_query]}}

    q = entity_authz_filter(q, state.authz)

    aggs = {'scoped': {'global': {}, 'aggs': {}}}
    if facets:
        facets = list(state.facet_names)
        if 'collections' in facets:
            aggs = facet_collections(state, q, aggs)
            facets.remove('collections')
        aggs = aggregate(state, q, aggs, facets)

    if state.sort == 'doc_count':
        sort = [{'doc_count': 'desc'}, '_score']
    elif state.sort == 'score':
        sort = ['_score', {'name_sort': 'asc'}]
    else:
        sort = [{'name_sort': 'asc'}]

    q = {
        'sort': sort,
        'query': filter_query(q, state.filters),
        'aggregations': aggs,
        'size': state.limit,
        'from': state.offset,
        '_source': fields or DEFAULT_FIELDS
    }

    result, hits, output = execute_basic(TYPE_ENTITY, q)
    output['facets'] = parse_facet_result(state, result)
    sub_queries = []
    for doc in hits.get('hits', []):
        entity = doc.get('_source')
        entity['id'] = doc.get('_id')
        entity['score'] = doc.get('_score')
        entity['api_url'] = url_for('entities_api.view', id=doc.get('_id'))
        output['results'].append(entity)

        sq = {'term': {'entities.id': entity['id']}}
        sq = add_filter(sq, {
            'terms': {'collection_id': state.authz.collections_read}
        })
        sq = {'size': 0, 'query': sq}
        sub_queries.append(json.dumps({}))
        sub_queries.append(json.dumps(sq))

    if doc_counts and len(sub_queries):
        # Get the number of matching documents for each entity.
        body = '\n'.join(sub_queries)
        res = es.msearch(index=es_index, doc_type=TYPE_DOCUMENT, body=body)
        for (entity, res) in zip(output['results'], res.get('responses')):
            entity['doc_count'] = res.get('hits', {}).get('total')

    return output


def load_entity(entity_id):
    """Load a single entity by ID."""
    result = es.get(index=es_index, doc_type=TYPE_ENTITY, id=entity_id,
                    ignore=[404])
    if result.get('found') is False:
        return
    entity = result.get('_source')
    entity.pop('text', None)
    entity['id'] = result.get('_id')
    return entity


def facet_collections(state, q, aggs):
    filters = state.filters
    filters['collection_id'] = state.authz.collections_read
    aggs['scoped']['aggs']['collections'] = {
        'filter': {
            'query': filter_query(q, filters)
        },
        'aggs': {
            'collections': {
                'terms': {'field': 'collection_id', 'size': state.facet_size}
            }
        }
    }
    return aggs


def suggest_entities(prefix, authz, min_count=0, schemas=None, size=5):
    """Auto-complete API."""
    options = []
    if prefix is not None and len(prefix.strip()):
        q = {
            'match_phrase_prefix': {'name': prefix.strip()}
        }
        if min_count > 0:
            q = add_filter(q, {'range': {'doc_count': {'gte': min_count}}})
        if schemas is not None and len(schemas):
            q = add_filter(q, {'terms': {'$schema': schemas}})

        # TODO: is this correct? should we allow filter by dataset entities?
        q = add_filter(q, {'terms': {'collection_id': authz.collections_read}})

        q = {
            'size': size,
            'sort': [{'doc_count': 'desc'}, '_score'],
            'query': q,
            '_source': ['name', 'schema', 'fingerprints', 'doc_count']
        }
        ref = latinize_text(prefix)
        result = es.search(index=es_index, doc_type=TYPE_ENTITY, body=q)
        for res in result.get('hits', {}).get('hits', []):
            ent = res.get('_source')
            terms = [latinize_text(t) for t in ent.pop('fingerprints', [])]
            ent['match'] = ref in terms
            ent['score'] = res.get('_score')
            ent['id'] = res.get('_id')
            options.append(ent)
    return {
        'prefix': prefix,
        'results': options
    }


def similar_entities(entity, state):
    """Merge suggestions API."""
    required = []
    boosters = []
    must = None

    # search for fingerprints
    for fp in entity.get('fingerprints', []):
        required.append(multi_match(fp, ['fingerprints'], 1))

    if not state.getbool('strict', False):
        # broaden search to similar names
        for name in entity.get('names', []):
            required.append(multi_match(name, ['names', 'text'], 1))

    # make it mandatory to have either a fingerprint or name match
    must = {"bool": {"should": required, "minimum_should_match": 1}}

    # boost by "contributing criteria"
    for field in ['dates', 'countries', 'addresses']:
        for val in entity.get(field, []):
            boosters.append(multi_match(val, [field]))

    state.raw_query = {
        "bool": {
            "should": boosters,
            "must": must,
            "must_not": {"ids": {"values": [entity.get('id')]}},
        }
    }
    # pprint(state.raw_query)
    return entities_query(state)
