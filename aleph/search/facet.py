import six

from aleph.model import Entity, Collection
from aleph.metadata.reference import COUNTRY_NAMES, LANGUAGE_NAMES


class Facet(object):

    def __init__(self, state, name, aggs):
        self.state = state
        self.name = name
        self.aggs = aggs

    def get_data(self):
        return self.aggs.get(self.name, {})

    def get_values(self):
        return set(self.state.get_filters(self.name))

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
            'values': list(sorted(results,
                                  key=lambda k: k['active'],
                                  reverse=True)),
        }


class CountryFacet(Facet):

    def expand(self, keys):
        return {k: {'label': COUNTRY_NAMES.get(k, k)} for k in keys}


class LanguageFacet(Facet):

    def expand(self, keys):
        return {k: {'label': LANGUAGE_NAMES.get(k, k)} for k in keys}


class EntityFacet(Facet):

    def get_values(self):
        return set(self.state.filters.get('entities.id'))

    def get_data(self):
        return self.aggs.get('entities', {}).get('inner', {}) \
            .get('entities', {})

    def expand(self, keys):
        entities = {}
        for entity in Entity.by_id_set(keys).values():
            data = entity.to_ref()
            data['label'] = data.pop('name', entity.id)
            entities[entity.id] = data
        return entities


class CollectionFacet(Facet):

    def get_values(self):
        return set(self.state.get_filters('collection_id'))

    def get_data(self):
        return self.aggs.get('scoped', {}).get('collections', {}) \
            .get('collections', {})

    def expand(self, keys):
        collections = {}
        for collection in Collection.all_by_ids(keys).all():
            collections[six.text_type(collection.id)] = {
                'label': collection.label,
                'category': collection.category
            }
        return collections


class PublicationDateFacet(Facet):
    def get_data(self):
        data = self.aggs.get(self.name, {})
        # recode timestamps as YYYY-MM
        for val in data.get('buckets', []):
            val['key'] = val['key_as_string'][:7]
        return data

    def to_dict(self):
        data = super(PublicationDateFacet, self).to_dict()
        # sort by YYYY-MM
        data['values'].sort(key=lambda k: k['id'])
        return data


def parse_facet_result(state, result):
    aggs = result.get('aggregations')
    facets = {}
    for name in state.facet_names:
        facet_cls = {
            'languages': LanguageFacet,
            'countries': CountryFacet,
            'jurisdiction_code': CountryFacet,
            'entities': EntityFacet,
            'collections': CollectionFacet,
            'publication_date': PublicationDateFacet,
        }.get(name, Facet)
        facets[name] = facet_cls(state, name, aggs).to_dict()
    return facets
