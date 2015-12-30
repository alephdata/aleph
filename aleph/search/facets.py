from babel import Locale
from pycountry import countries

from aleph.model.metadata import CORE_FACETS


def convert_bucket(facet, bucket):
    key = bucket.get('key')
    data = {
        'count': bucket.get('doc_count'),
        'key': key,
        'label': key,
    }

    if facet == 'languages':
        try:
            locale = Locale(key.strip().lower())
            data['label'] = locale.get_display_name('en_US')
        except:
            pass
    elif facet == 'countries' and key is not None:
        try:
            country = countries.get(alpha2=key.strip().upper())
            data['label'] = country.name
        except:
            pass
    return data


def convert_aggregations(result, facets):
    """ traverse and get all facets. """
    output = {}
    aggs = result.get('aggregations', {})
    for facet in facets:
        scoped = aggs.get('scoped', {}).get(facet, {})
        value = aggs.get(facet, scoped.get(facet, {}))
        data = {
            'label': CORE_FACETS.get(facet),
            'values': [convert_bucket(facet, b) for b in value.get('buckets')]
        }
        output[facet] = data
    return output
