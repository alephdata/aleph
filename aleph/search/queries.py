from werkzeug.datastructures import MultiDict


def document_query(args, collections=None):
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
        q = {
            "bool": {
                "must": q,
                "should": bq
            }
        }
    else:
        q = {'match_all': {}}

    if collections is not None:
        colls = args.getlist('collection') or collections
        colls = [c for c in colls if c in collections]
        if not len(colls):
            colls = ['none']
        cf = {'terms': {'collection': colls}}
        q = {
            'filtered': {
                'query': q,
                'filter': cf
            }
        }

    # query facets
    aggs = {
        'collections': {
            'terms': {'field': 'collection'}
        }
    }
    #q['aggregations'] = aggs

    return {
        'query': q,
        'aggregations': aggs,
        '_source': ['title', 'name', 'extension', 'collection',
                    'id', 'updated_at', 'slug', 'source_url', 'source',
                    'summary']
    }
