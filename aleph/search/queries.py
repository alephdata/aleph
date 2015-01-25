from werkzeug.datastructures import MultiDict


def document_query(args):
    if not isinstance(args, MultiDict):
        args = MultiDict(args)
    qstr = args.get('q', '').strip()
    if len(qstr):
        q = {'query_string': {'query': qstr}}
        bq = [
            {"term": {"title": {"value": qstr, "boost": 10.0}}},
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
    return {
        'query': q,
        '_source': ['title', 'name', 'extension', 'collection', 'mime_type',
                    'id', 'updated_at', 'slug']
    }
