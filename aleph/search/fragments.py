from normality import ascii_text

from aleph.search.util import add_filter


def match_all():
    return {'match_all': {}}


def text_query_string(text, literal=False):
    if text is None or not len(text.strip()):
        return match_all()
    if literal:
        text = '"%s"' % ascii_text(text)
    return {
        'query_string': {
            'query': text,
            'fields': ['text'],
            'default_operator': 'AND',
            'use_dis_max': True
        }
    }


def authz_filter(q, authz, roles=False):
    if authz.is_admin:
        return q

    fq = {'terms': {'collection_id': list(authz.collections_read)}}

    if roles:
        iq = {'terms': {'roles': list(authz.roles)}}
        fq = {'bool': {
            'should': [iq, fq],
            'minimum_should_match': 1
        }}
    return add_filter(q, fq)


def text_query(text):
    """Part of a query which finds a piece of text."""
    if text is None or not len(text.strip()):
        return match_all()
    return {
        "query_string": {
            "query": text,
            "fields": ['title^5', 'title_latin^4',
                       'summary^3', 'summary_latin^2',
                       'file_name', 'text', '_all'],
            "default_operator": "AND",
            "use_dis_max": True
        }
    }


def multi_match(text, fields, fuzziness=0):
    q = {
        'multi_match': {
            "fields": fields,
            "query": text,
            "operator": "AND"
        }
    }
    if fuzziness > 0:
        q['multi_match']['fuzziness'] = fuzziness
    return q


def phrase_match(text, field):
    return {
        'match_phrase': {
            field: {
                'query': text,
                'slop': 3
            }
        }
    }


def aggregate(state, q, aggs, facets):
    """Generate aggregations, a generalized way to do facetting."""
    for facet in facets:
        aggs.update({facet: {
            'terms': {'field': facet, 'size': state.facet_size}}
        })
    return aggs


def filter_query(q, filters):
    """Apply a list of filters to the given query."""
    for field, values in filters.items():
        if field == 'collection_id' and len(values):
            q = add_filter(q, {'terms': {field: list(values)}})
        elif field == 'dataset' and len(values):
            q = add_filter(q, {'terms': {field: list(values)}})
        else:
            for value in values:
                if value is not None:
                    q = add_filter(q, {'term': {field: value}})
    return q
