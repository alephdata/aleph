import json
from pprint import pprint  # noqa

from aleph.core import url_for, es, es_index
from aleph.index import TYPE_ENTITY, TYPE_DOCUMENT
from aleph.search.util import execute_basic
from aleph.search.fragments import match_all, filter_query
from aleph.search.fragments import add_filter, aggregate
from aleph.search.facet import parse_facet_result
from aleph.text import latinize_text

DEFAULT_FIELDS = ['collection_id', 'name', 'summary', 'jurisdiction_code',
                  '$schema']


def entities_query(state, fields=None, facets=True):
    """Parse a user query string, compose and execute a query."""
    if state.has_text:
        q = {
            "query_string": {
                "query": state.text,
                "fields": ['name^15', 'name_latin^5',
                           'terms^12', 'terms_latin^3',
                           'summary^10', 'summary_latin^7',
                           'description^5', 'description_latin^3'],
                "default_operator": "AND",
                "use_dis_max": True
            }
        }
    else:
        q = match_all()

    aggs = {'scoped': {'global': {}, 'aggs': {}}}
    if facets:
        facets = list(state.facet_names)
        if 'collections' in facets:
            aggs = facet_collections(q, aggs, state)
            facets.remove('collections')
        aggs = aggregate(q, aggs, facets)

    if state.sort == 'doc_count':
        sort = [{'doc_count': 'desc'}, '_score']
    elif state.sort == 'alphabet':
        sort = [{'name_sort': 'asc'}, '_score']
    else:
        sort = ['_score']

    return {
        'sort': sort,
        'query': filter_query(q, state.filters),
        'aggregations': aggs,
        '_source': fields or DEFAULT_FIELDS
    }


def facet_collections(q, aggs, state):
    filters = state.filters
    filters['collection_id'] = state.authz_collections
    aggs['scoped']['aggs']['collections'] = {
        'filter': {
            'query': filter_query(q, filters)
        },
        'aggs': {
            'collections': {
                'terms': {'field': 'collection_id', 'size': 1000}
            }
        }
    }
    return aggs


def suggest_entities(prefix, collections, min_count=0, schemas=None, size=5):
    """Auto-complete API."""
    options = []
    if prefix is not None and len(prefix.strip()):
        q = {
            'match_phrase_prefix': {'terms': prefix.strip()}
        }
        if min_count > 0:
            q = add_filter(q, {'range': {'doc_count': {'gte': min_count}}})
        if schemas is not None and len(schemas):
            q = add_filter(q, {'terms': {'$schema': schemas}})
        q = add_filter(q, {'terms': {'collection_id': collections}})
        q = {
            'size': size,
            'sort': [{'doc_count': 'desc'}, '_score'],
            'query': q,
            '_source': ['name', '$schema', 'terms', 'doc_count']
        }
        ref = latinize_text(prefix)
        result = es.search(index=es_index, doc_type=TYPE_ENTITY, body=q)
        for res in result.get('hits', {}).get('hits', []):
            ent = res.get('_source')
            terms = [latinize_text(t) for t in ent.pop('terms', [])]
            ent['match'] = ref in terms
            ent['score'] = res.get('_score')
            ent['id'] = res.get('_id')
            options.append(ent)
    return {
        'prefix': prefix,
        'results': options
    }


def similar_entities(entity, collections):
    """Merge suggestions API."""
    shoulds = []
    for term in entity.terms:
        shoulds.append({
            'multi_match': {
                "fields": ["name^50", "terms^25", "summary^5"],
                "query": term,
                "fuzziness": 2
            }
        })
        shoulds.append({
            'multi_match': {
                "fields": ["name_latin^10", "terms_latin^5", "summary_latin"],
                "query": latinize_text(term),
                "fuzziness": 2
            }
        })

    q = {
        "bool": {
            "should": shoulds,
            "must_not": {
                "ids": {
                    "values": [entity.id]
                }
            },
            "must": {
                "terms": {
                    "collection_id": collections
                }
            },
            "minimum_should_match": 1
        }
    }
    q = {
        'size': 10,
        'query': q,
        '_source': DEFAULT_FIELDS
    }
    options = []
    result = es.search(index=es_index, doc_type=TYPE_ENTITY, body=q)
    for res in result.get('hits', {}).get('hits', []):
        entity = res.get('_source')
        entity['id'] = res.get('_id')
        entity['score'] = res.get('_score')
        entity['api_url'] = url_for('entities_api.view', id=res.get('_id'))
        options.append(entity)
    return {
        'results': options
    }


def execute_entities_query(state, query, doc_counts=False):
    """Execute the query and return a set of results."""
    result, hits, output = execute_basic(TYPE_ENTITY, query)
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
            'terms': {
                'collection_id': state.authz_collections
            }
        })
        sq = {'size': 0, 'query': sq}
        sub_queries.append(json.dumps({}))
        sub_queries.append(json.dumps(sq))

    if doc_counts and len(sub_queries):
        body = '\n'.join(sub_queries)
        res = es.msearch(index=es_index, doc_type=TYPE_DOCUMENT, body=body)
        for (entity, res) in zip(output['results'], res.get('responses')):
            entity['doc_count'] = res.get('hits', {}).get('total')

    return output
