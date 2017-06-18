import six
from dalet import COUNTRY_NAMES, LANGUAGE_NAMES

from aleph.core import schemata, get_config
from aleph.model import Collection


class Facet(object):

    def __init__(self, name, aggregations, parser):
        self.name = name
        self.parser = parser
        self.data = aggregations.get('scoped', {}).get(name, {}).get(name)
        if self.data is None:
            self.data = aggregations.get(name)

    def expand(self, keys):
        pass

    def update(self, result):
        pass

    def to_dict(self):
        results = []
        active = list(self.parser.filters.get(self.name, []))

        for bucket in self.data.get('buckets', []):
            key = six.text_type(bucket.get('key'))
            results.append({
                'id': key,
                'label': key,
                'count': bucket.pop('doc_count', 0),
                'active': key in active
            })
            if key in active:
                active.remove(key)

        for key in active:
            results.insert(0, {
                'id': key,
                'label': key,
                'count': 0,
                'active': True
            })

        self.expand([r.get('id') for r in results])
        for result in results:
            self.update(result, result.get('id'))

        results = sorted(results, key=lambda k: k['active'], reverse=True)
        return {
            'values': results,
        }


class SchemaFacet(Facet):

    def update(self, result, key):
        key = result.get('id')
        try:
            result['label'] = schemata.get(key).plural
        except NameError:
            result['label'] = key


class CountryFacet(Facet):

    def update(self, result, key):
        result['label'] = COUNTRY_NAMES.get(key, key)


class LanguageFacet(Facet):

    def update(self, result, key):
        result['label'] = LANGUAGE_NAMES.get(key, key)


class CategoryFacet(Facet):

    def expand(self, keys):
        self.categories = get_config('COLLECTION_CATEGORIES', {})

    def update(self, result, key):
        result['label'] = self.categories.get(key, key)


class CollectionFacet(Facet):

    def expand(self, keys):
        self.collections = Collection.all_by_ids(keys).all()

    def update(self, result, key):
        authz = self.parser.authz
        for collection in self.collections:
            if six.text_type(collection.id) == key:
                result['label'] = collection.label
                result['category'] = collection.category
                result['public'] = authz.collection_public(collection.id)
