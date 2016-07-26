import json
from pprint import pprint  # noqa

from werkzeug.datastructures import MultiDict

from aleph.core import url_for, get_es, get_es_index
from aleph.index import TYPE_ENTITY, TYPE_DOCUMENT
from aleph.search.util import authz_filter
from aleph.search.util import execute_basic, parse_filters
from aleph.search.fragments import match_all, filter_query
from aleph.search.fragments import add_filter, aggregate
from aleph.search.facets import convert_entity_aggregations
from aleph.text import latinize_text

DEFAULT_FIELDS = ['collection_id', 'name', 'summary', 'jurisdiction_code',
                  '$schema', 'doc_count']

# Scoped facets are facets where the returned facet values are returned such
# that any filter against the same field will not be applied in the sub-query
# used to generate the facet values.
OR_FIELDS = ['collections']


def entities_query(args, fields=None, facets=True):
    """Parse a user query string, compose and execute a query."""
    if not isinstance(args, MultiDict):
        args = MultiDict(args)
    text = args.get('q', '').strip()
    if text is None or not len(text):
        q = match_all()
    else:
        q = {
            "query_string": {
                "query": text,
                "fields": ['name^15', 'name_latin^5',
                           'terms^12', 'terms_latin^3',
                           'summary^10', 'summary_latin^7',
                           'description^5', 'description_latin^3'],
                "default_operator": "AND",
                "use_dis_max": True
            }
        }

    q = authz_filter(q)
    filters = parse_filters(args)
    aggs = {'scoped': {'global': {}, 'aggs': {}}}
    if facets:
        facets = args.getlist('facet')
        if 'collections' in facets:
            aggs = facet_collections(q, aggs, filters)
            facets.remove('collections')
        aggs = aggregate(q, aggs, facets)

    sort_mode = args.get('sort', '').strip().lower()
    default_sort = 'score' if len(text) else 'doc_count'
    sort_mode = sort_mode or default_sort
    if sort_mode == 'doc_count':
        sort = [{'doc_count': 'desc'}, '_score']
    elif sort_mode == 'alphabet':
        sort = [{'name': 'asc'}, '_score']
    elif sort_mode == 'score':
        sort = ['_score']

    return {
        'sort': sort,
        'query': filter_query(q, filters, OR_FIELDS),
        'aggregations': aggs,
        '_source': fields or DEFAULT_FIELDS
    }


def facet_collections(q, aggs, filters):
    aggs['scoped']['aggs']['collections'] = {
        'filter': {
            'query': filter_query(q, filters, OR_FIELDS, skip='collection_d')
        },
        'aggs': {
            'collections': {
                'terms': {'field': 'collection_id', 'size': 1000}
            }
        }
    }
    return aggs


def suggest_entities(prefix, min_count=0, schemas=None, size=5):
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
        q = {
            'size': size,
            'sort': [{'doc_count': 'desc'}, '_score'],
            'query': authz_filter(q),
            '_source': ['name', '$schema', 'terms', 'doc_count']
        }
        ref = latinize_text(prefix)
        result = get_es().search(index=get_es_index(), doc_type=TYPE_ENTITY,
                                 body=q)
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


def similar_entities(entity, args, collections):
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
        'query': authz_filter(q),
        '_source': DEFAULT_FIELDS
    }
    options = []
    result = get_es().search(index=get_es_index(), doc_type=TYPE_ENTITY,
                             body=q)
    for res in result.get('hits', {}).get('hits', []):
        entity = res.get('_source')
        entity['id'] = res.get('_id')
        entity['score'] = res.get('_score')
        entity['api_url'] = url_for('entities_api.view', id=res.get('_id'))
        options.append(entity)
    return {
        'results': options
    }


def execute_entities_query(args, query, doc_counts=False):
    """Execute the query and return a set of results."""
    result, hits, output = execute_basic(TYPE_ENTITY, query)
    convert_entity_aggregations(result, output, args)
    for doc in hits.get('hits', []):
        entity = doc.get('_source')
        entity['id'] = doc.get('_id')
        entity['score'] = doc.get('_score')
        entity['api_url'] = url_for('entities_api.view', id=doc.get('_id'))
        output['results'].append(entity)
    return output
