from copy import deepcopy

from werkzeug.datastructures import MultiDict

DEFAULT_FIELDS = ['title', 'name', 'extension', 'collection',
                  'id', 'updated_at', 'slug', 'source_url', 'source',
                  'summary']


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


def document_query(args, fields=DEFAULT_FIELDS, sources=None, lists=None,
                   facets=True):
    if not isinstance(args, MultiDict):
        args = MultiDict(args)
    qstr = args.get('q', '').strip()
    if len(qstr):
        q = {'query_string': {'query': qstr}}
        bq = [
            {"term": {"title": {"value": qstr, "boost": 10.0}}},
            {"term": {"name": {"value": qstr, "boost": 7.0}}},
            {"term": {"text": {"value": qstr, "boost": 3.0}}}
        ]
        filtered_q = {
            "bool": {
                "must": q,
                "should": bq
            }
        }
    else:
        filtered_q = {'match_all': {}}

    # entities filter
    for entity in args.getlist('entity'):
        cf = {'term': {'entities.id': entity}}
        filtered_q = add_filter(filtered_q, cf)

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
            },
            'lists': {
                'filter': {'terms': {'entities.list': lists or []}},
                'aggs': {
                    'entities': {
                        'terms': {'field': 'entities.id',
                                  'size': 100}
                    }
                }
            }
        }

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
            'terms': {'field': 'attributes.name'}
        }
    }
    q['size'] = 0
    return q
