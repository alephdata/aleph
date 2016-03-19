from pprint import pprint  # noqa

from aleph.index import TYPE_RECORD
from aleph.search.util import add_filter, execute_basic
from aleph.search.fragments import text_query_string, match_all


def tabular_query(document_id, sheet, args):
    scored = False
    q = match_all()
    text = args.get('q', '').strip()
    if len(text):
        scored = True
        q = text_query_string(text)

    try:
        rows = [int(r) for r in args.getlist('row')]
    except Exception:
        rows = []

    if len(rows):
        scored = True
        q = {
            "bool": {
                "must": q,
                "should": {
                    "constant_score": {
                        "filter": {'terms': {'row_id': rows}},
                        "boost": 1000
                    }
                }
            }
        }

    q = add_filter(q, {'term': {'document_id': document_id}})
    q = add_filter(q, {'term': {'sheet': sheet}})

    # pprint(q)

    sort = [{'row_id': 'asc'}]
    if scored:
        sort.insert(0, '_score')
    return {
        'from': 0,
        'size': 100,
        'query': q,
        'sort': sort,
        '_source': ['document_id', 'sheet', 'row_id', 'raw']
    }


def execute_tabular_query(query):
    """Execute a query against records and return a set of results."""
    result, hits, output = execute_basic(TYPE_RECORD, query)
    for rec in hits.get('hits', []):
        record = rec.get('_source').get('raw')
        record['_id'] = rec.get('_source', {}).get('row_id')
        output['results'].append(record)
    return output
