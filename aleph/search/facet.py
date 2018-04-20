import six
from followthemoney import model
from flask.ext.babel import get_locale
from exactitude import countries, languages

from aleph.model import Collection


class Facet(object):

    def __init__(self, name, aggregations, parser):
        self.name = name
        self.parser = parser
        self.data = self.extract(aggregations, name)
        self.cardinality = self.extract(aggregations, '%s.cardinality' % name)

    def extract(self, aggregations, name):
        if aggregations is None:
            return {}
        aggregations = aggregations.get('%s.filtered' % name, aggregations)
        data = aggregations.get('scoped', {}).get(name, {}).get(name)
        return data or aggregations.get(name, {})

    def expand(self, keys):
        pass

    def update(self, result, key):
        pass

    def to_dict(self):
        active = list(self.parser.filters.get(self.name, []))
        data = {'filters': active}
        if self.parser.get_facet_total(self.name):
            data['total'] = self.cardinality.get('value')

        if self.parser.get_facet_values(self.name):
            results = []
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

            data['values'] = sorted(results,
                                    key=lambda k: k['count'],
                                    reverse=True)
        return data


class SchemaFacet(Facet):

    def update(self, result, key):
        try:
            result['label'] = model.get(key).plural
        except AttributeError:
            result['label'] = key


class CountryFacet(Facet):

    def update(self, result, key):
        label = countries.names.get(key, key)
        result['label'] = get_locale().territories.get(key.upper(), label)


class LanguageFacet(Facet):

    def update(self, result, key):
        label = languages.names.get(key, key)
        result['label'] = get_locale().languages.get(key.upper(), label)


class CategoryFacet(Facet):

    def update(self, result, key):
        result['label'] = Collection.CATEGORIES.get(key, key)


class CollectionFacet(Facet):

    def expand(self, keys):
        q = Collection.all_by_ids(keys, authz=self.parser.authz)
        self.collections = q.all()

    def update(self, result, key):
        for collection in self.collections:
            if six.text_type(collection.id) == key:
                result['label'] = collection.label
                result['category'] = collection.category
