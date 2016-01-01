from pprint import pprint  # noqa

from babel import Locale
from pycountry import countries

from aleph.model.metadata import CORE_FACETS
from aleph.model.entity import Entity


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


def convert_list(entities, list_id):
    output = {'entities': []}
    buckets = entities.get('buckets', [])
    entities = Entity.by_id_set([e.get('key') for e in buckets],
                                list_id=list_id)
    for bucket in buckets:
        entity = entities.get(bucket.get('key'))
        if entity is None:
            continue
        data = entity.to_dict()
        data['count'] = bucket.get('doc_count')
        output['entities'].append(data)
    return output


def convert_aggregations(result, output, args):
    """ traverse and get all facets. """
    aggs = result.get('aggregations', {})

    for list_id in args.getlist('watchlist'):
        value = aggs.get('list__%s' % list_id, {})
        value = value.get('inner', {}).get('entities', {})
        output['watchlists'][list_id] = convert_list(value, list_id)

    for facet in args.getlist('facet'):
        scoped = aggs.get('scoped', {}).get(facet, {})
        value = aggs.get(facet, scoped.get(facet, {}))
        data = {
            'label': CORE_FACETS.get(facet),
            'values': [convert_bucket(facet, b) for b in value.get('buckets')]
        }
        output['facets'][facet] = data
    return output
