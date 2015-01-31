from copy import deepcopy

from werkzeug.datastructures import MultiDict


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
    

def document_query(args, collections=None, lists=None):
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
    entities = args.getlist('entity')
    if len(entities):
        cf = {'terms': {'entities.id': entities}}
        filtered_q = add_filter(filtered_q, cf)

    q = deepcopy(filtered_q)

    # collections filter
    if collections is not None:
        colls = args.getlist('collection') or collections
        colls = [c for c in colls if c in collections]
        if not len(colls):
            colls = ['none']
        cf = {'terms': {'collection': colls}}
        q = add_filter(q, cf)

    # query facets
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
                'entities': {'terms': {'field': 'entities.id'}}
            }
        }
    }

    q = {
        'query': q,
        'aggregations': aggs,
        '_source': ['title', 'name', 'extension', 'collection',
                    'id', 'updated_at', 'slug', 'source_url', 'source',
                    'summary']
    }
    # import json
    # print json.dumps(q, indent=2)
    return q

