import six
from dalet import COUNTRY_NAMES, LANGUAGE_NAMES

from aleph.core import schemata, get_config
from aleph.model import Collection


class Facet(object):

    def __init__(self, state, name, aggs):
        self.state = state
        self.name = name
        self.aggs = aggs

    def get_data(self):
        return self.aggs.get(self.name, {})

    def get_values(self):
        return self.state.filters.get(self.name, set())

    def expand(self, keys):
        return {}

    def to_dict(self):
        buckets = self.get_data().get('buckets', [])
        values = self.get_values()
        for bucket in buckets:
            bucket['id'] = six.text_type(bucket.pop('key'))
            bucket['label'] = bucket['id']
            bucket['count'] = bucket.pop('doc_count', 0)
            bucket['active'] = bucket['id'] in values
            if bucket['active']:
                values.discard(bucket['id'])
        for value in values:
            buckets.append({
                'id': value,
                'label': value,
                'count': 0,
                'active': True
            })
        results = []
        expanded = self.expand([b.get('id') for b in buckets])
        for bucket in buckets:
            bucket.update(expanded.get(bucket.get('id'), {}))
            results.append(bucket)

        return {
            'type': type(self).__name__.replace('Facet', '').lower(),
            'values': list(sorted(results,
                                  key=lambda k: k['active'],
                                  reverse=True)),
        }


class SchemaFacet(Facet):

    def expand(self, keys):
        labels = {}
        for key in keys:
            try:
                labels[key] = {'label': schemata.get(key).plural}
            except NameError:
                labels[key] = {'label': key}
        return labels


class CountryFacet(Facet):

    def expand(self, keys):
        return {k: {'label': COUNTRY_NAMES.get(k, k)} for k in keys}


class LanguageFacet(Facet):

    def expand(self, keys):
        return {k: {'label': LANGUAGE_NAMES.get(k, k)} for k in keys}


class CategoryFacet(Facet):

    def expand(self, keys):
        categories = get_config('COLLECTION_CATEGORIES', {})
        return {k: {'label': categories.get(k)} for k in keys}


class CollectionFacet(Facet):

    def get_values(self):
        return self.state.filters.get('collection_id', set())

    def get_data(self):
        return self.aggs.get('scoped', {}).get('collections', {}) \
            .get('collections', {})

    def expand(self, keys):
        collections = {}
        for collection in Collection.all_by_ids(keys).all():
            collections[six.text_type(collection.id)] = {
                'label': collection.label,
                'category': collection.category,
                'public': self.state.authz.collection_public(collection.id)
            }
        return collections


def parse_facet_result(state, result):
    aggs = result.get('aggregations')
    facets = {}
    for name in state.facet_names:
        facet_cls = {
            'languages': LanguageFacet,
            'countries': CountryFacet,
            'category': CategoryFacet,
            'remote.countries': CountryFacet,
            'schema': SchemaFacet,
            'schemata': SchemaFacet,
            'collections': CollectionFacet
        }.get(name, Facet)
        facets[name] = facet_cls(state, name, aggs).to_dict()
    return facets
