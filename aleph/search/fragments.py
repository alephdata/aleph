from aleph.index import TYPE_RECORD
from aleph.util import latinize_text


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


def child_record(q):
    return {
        "has_child": {
            "type": TYPE_RECORD,
            "query": q
        }
    }
