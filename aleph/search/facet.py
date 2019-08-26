from followthemoney import model
from followthemoney.types import registry

from aleph.model import Collection
from aleph.logic import resolver


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
                key = str(bucket.get('key'))
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
        result['label'] = registry.country.names.get(key, key)


class LanguageFacet(Facet):

    def update(self, result, key):
        result['label'] = registry.language.names.get(key, key)


class CategoryFacet(Facet):

    def update(self, result, key):
        result['label'] = Collection.CATEGORIES.get(key, key)


class CollectionFacet(Facet):

    def expand(self, keys):
        for key in keys:
            if self.parser.authz.can(key, self.parser.authz.READ):
                resolver.queue(self.parser, Collection, key)
        resolver.resolve(self.parser)

    def update(self, result, key):
        collection = resolver.get(self.parser, Collection, key)
        if collection is not None:
            result['label'] = collection.get('label')
            result['category'] = collection.get('category')
