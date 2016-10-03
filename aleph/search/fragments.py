from collections import defaultdict

from aleph.index import TYPE_RECORD
from aleph.text import latinize_text
from aleph.search.util import add_filter, FACET_SIZE


def match_all():
    return {'match_all': {}}


def text_query_string(text, literal=False):
    if text is None or not len(text.strip()):
        return match_all()
    if literal:
        text = '"%s"' % latinize_text(text)
    return {
        'query_string': {
            'query': text,
            'fields': ['text^6', 'text_latin^2'],
            'default_operator': 'AND',
            'use_dis_max': True
        }
    }


def meta_query_string(text, literal=False):
    if text is None or not len(text.strip()):
        return match_all()
    if literal:
        text = '"%s"' % latinize_text(text)
    return {
        "query_string": {
            "query": text,
            "fields": ['title^15', 'file_name',
                       'summary^10', 'title_latin^12',
                       'summary_latin^8'],
            "default_operator": "AND",
            "use_dis_max": True
        }
    }


def text_query(text):
    """Part of a query which finds a piece of text."""
    if text is None or not len(text.strip()):
        return match_all()
    return {
        "bool": {
            "minimum_should_match": 1,
            "should": [
                meta_query_string(text),
                child_record({
                    "bool": {
                        "should": [text_query_string(text)]
                    }
                })
            ]
        }
    }


def child_record(q):
    return {
        "has_child": {
            "type": TYPE_RECORD,
            "query": q
        }
    }


def aggregate(q, aggs, facets):
    """Generate aggregations, a generalized way to do facetting."""
    for facet in facets:
        aggs.update({facet: {
            'terms': {'field': facet, 'size': FACET_SIZE}}
        })
    return aggs


def filter_query(q, filters, or_fields, skip=None):
    """Apply a list of filters to the given query."""
    or_filters = defaultdict(list)
    for field, value in filters:
        if field == skip:
            continue
        if field in or_fields:
            or_filters[field].append(value)
        else:
            q = add_filter(q, {'term': {field: value}})
    for field, value in or_filters.items():
        if len(value):
            q = add_filter(q, {'terms': {field: value}})
    return q
