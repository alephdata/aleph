from copy import deepcopy

from werkzeug.datastructures import MultiDict

DEFAULT_FIELDS = ['title', 'name', 'extension', 'collection',
                  'id', 'updated_at', 'slug', 'source_url', 'source',
                  'summary']

QUERY_FIELDS = ['title', 'source_url', 'summary', 'extension', 'mime_type',
                'text', 'entities.label', 'attributes.value']


def add_filter(q, flt):
    if 'filtered' not in q:
        return {
            'filtered': {
                'query': q,
                'filter': flt
            }
        }

    if 'and' in q['filtered']['filter']:
        q['filtered']['filter']['and'].append(flt)
    else:
        q['filtered']['filter'] = \
            {'and': [flt, q['filtered']['filter']]}
    return q


def get_list_facets(args):
    for list_id in args.getlist('listfacet'):
        try:
            yield int(list_id)
        except:
            pass


def document_query(args, fields=DEFAULT_FIELDS, sources=None, lists=None,
                   facets=True):
    if not isinstance(args, MultiDict):
        args = MultiDict(args)
    qstr = args.get('q', '').strip()
    if len(qstr):
        filtered_q = {
            "bool": {
                "must": {
                    "multi_match": {
                        "query": qstr,
                        "fields": QUERY_FIELDS,
                        "type": "best_fields",
                        "cutoff_frequency": 0.0007,
                        "operator": "and",
                    },
                },
                "should": {
                    "multi_match": {
                        "query": qstr,
                        "fields": QUERY_FIELDS,
                        "type": "phrase"
                    },
                }
            }
        }
    else:
        filtered_q = {'match_all': {}}

    # entities filter
    for entity in args.getlist('entity'):
        cf = {'term': {'entities.id': entity}}
        filtered_q = add_filter(filtered_q, cf)

    for key, value in args.items():
        if not key.startswith('attribute-'):
            continue
        _, attr = key.split('attribute-', 1)
        af = {
            "nested": {
                "path": "attributes",
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"attributes.name": attr}},
                            {"term": {"attributes.value": value}}
                        ]
                    }
                }
            }
        }
        filtered_q = add_filter(filtered_q, af)

    q = deepcopy(filtered_q)

    # collections filter
    if sources is not None:
        srcs = args.getlist('source') or sources
        srcs = [c for c in srcs if c in sources]
        if not len(srcs):
            srcs = ['none']
        cf = {'terms': {'collection': srcs}}
        q = add_filter(q, cf)

        all_coll_f = {'terms': {'collection': sources}}
        filtered_q = add_filter(filtered_q, all_coll_f)

    aggs = {}

    # query facets
    if facets:
        aggs = {
            'all': {
                'global': {},
                'aggs': {
                    'ftr': {
                        'filter': {'query': filtered_q},
                        'aggs': {
                            'collections': {
                                'terms': {'field': 'collection'}
                            }
                        }
                    }
                }
            }
        }

        for list_id in get_list_facets(args):
            if list_id not in lists:
                continue

            list_facet = {
                'nested': {
                    'path': 'entities'
                },
                'aggs': {
                    'inner': {
                        'filter': {'term': {'entities.list': list_id}},
                        'aggs': {
                            'entities': {
                                'terms': {'field': 'entity',
                                          'size': 50}
                            }
                        }
                    }
                }
            }
            aggs['list_%s' % list_id] = list_facet

        for attr in args.getlist('attributefacet'):
            attr_facet = {
                'nested': {
                    'path': 'attributes'
                },
                'aggs': {
                    'inner': {
                        'filter': {'term': {'attributes.name': attr}},
                        'aggs': {
                            'values': {
                                'terms': {'field': 'value',
                                          'size': 50}
                            }
                        }
                    }
                }
            }
            aggs['attr_%s' % attr] = attr_facet

    q = {
        'query': q,
        'aggregations': aggs,
        '_source': fields
    }
    # import json
    # print json.dumps(q, indent=2)
    return q


def entity_query(selectors):
    texts = []
    for selector in selectors:
        if hasattr(selector, 'normalized'):
            selector = selector.normalized
        texts.append(selector)
    q = {
        'query': {'terms': {'normalized': texts}},
        '_source': ['collection', 'id']
    }
    return q


def attributes_query(args, sources=None, lists=None):
    q = document_query(args, sources=sources, lists=lists,
                       facets=False)
    q['aggregations'] = {
        'attributes': {
            'terms': {'field': 'attributes.name',
                      'size': 200}
        }
    }
    q['size'] = 0
    return q
