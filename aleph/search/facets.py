from pprint import pprint  # noqa

from babel import Locale
from pycountry import countries

from aleph.model import Entity, Source, Collection


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
        results.append({
            'id': entity.id,
            'name': entity.name,
            '$schema': entity.type,
            'count': bucket.get('doc_count')
        })
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


def convert_collections(facet):
    output = {'values': []}
    ids = [b.get('key') for b in facet.get('buckets', [])]
    if not len(ids):
        return output
    collections = Collection.all_by_ids(ids).all()
    for bucket in facet.get('buckets', []):
        key = bucket.get('key')
        for collection in collections:
            if collection.id != key:
                continue
            output['values'].append({
                'id': key,
                'label': collection.label,
                'count': bucket.get('doc_count')
            })
    return output


def convert_facets(result, output, args):
    """Convert all facets to result format."""
    aggs = result.get('aggregations', {})
    output['facets'] = {}
    for facet in args.getlist('facet'):
        value = aggs.get(facet)
        data = {
            'values': [convert_bucket(facet, b) for b in value.get('buckets')]
        }
        output['facets'][facet] = data
    return output


def convert_document_aggregations(result, output, args):
    """Traverse and get all facets."""
    aggs = result.get('aggregations', {})
    scoped = aggs.get('scoped', {})
    sources = scoped.get('source', {}).get('source', {})
    output['sources'] = convert_sources(sources)
    entities = aggs.get('entities', {}).get('inner', {})
    entities = entities.get('entities', {})
    output['entities'] = convert_entities(entities)
    return convert_facets(result, output, args)


def convert_entity_aggregations(result, output, args):
    """Traverse and get all facets."""
    aggs = result.get('aggregations', {})
    scoped = aggs.get('scoped', {})
    collections = scoped.get('collection', {}).get('collection', {})
    output['collections'] = convert_collections(collections)
    return convert_facets(result, output, args)
