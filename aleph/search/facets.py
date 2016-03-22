from pprint import pprint  # noqa

from babel import Locale
from pycountry import countries

from aleph.model.constants import CORE_FACETS
from aleph.model.entity import Entity
from aleph.model.source import Source


def convert_bucket(facet, bucket):
    key = bucket.get('key_as_string', bucket.get('key'))
    data = {
        'count': bucket.get('doc_count'),
        'id': key,
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


def convert_entities(entities):
    results = []
    buckets = entities.get('buckets', [])
    entities = Entity.by_id_set([e.get('key') for e in buckets])
    for bucket in buckets:
        entity = entities.get(bucket.get('key'))
        if entity is None:
            continue
        data = entity.to_dict()
        data['count'] = bucket.get('doc_count')
        results.append(data)
    return results


def convert_sources(facet):
    output = {'values': []}
    ids = [b.get('key') for b in facet.get('buckets', [])]
    sources = Source.all_by_ids(ids).all()
    for bucket in facet.get('buckets', []):
        key = bucket.get('key')
        for source in sources:
            if source.id != key:
                continue
            output['values'].append({
                'id': key,
                'label': source.label,
                'category': source.category,
                'count': bucket.get('doc_count')
            })
    return output


def convert_aggregations(result, output, args):
    """Traverse and get all facets."""
    aggs = result.get('aggregations', {})
    scoped = aggs.get('scoped', {})
    sources = scoped.get('source', {}).get('source', {})
    output['sources'] = convert_sources(sources)

    entities = aggs.get('entities', {}).get('inner', {})
    entities = entities.get('entities', {})
    output['entities'] = convert_entities(entities)

    output['facets'] = {}
    for facet in args.getlist('facet'):
        value = aggs.get(facet)
        data = {
            'label': CORE_FACETS.get(facet),
            'values': [convert_bucket(facet, b) for b in value.get('buckets')]
        }
        output['facets'][facet] = data
    return output
