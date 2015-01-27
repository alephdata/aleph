from werkzeug.datastructures import MultiDict


def document_query(args, authorized=None):
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

    if authorized is not None:
        collections = args.getlist('collection') or authorized
        collections = [c for c in collections if c in authorized]
        if not len(collections):
            collections = ['none']
        cf = [{'term': {'collection': c}} for c in collections]
        q = {
            'filtered': {
                'query': q,
                'filter': {'or': {'filters': cf}}
            }
        }
    return {
        'query': q,
        '_source': ['title', 'name', 'extension', 'collection', 'mime_type',
                    'id', 'updated_at', 'slug', 'source_url', 'source_site',
                    'source_label', 'summary']
    }
