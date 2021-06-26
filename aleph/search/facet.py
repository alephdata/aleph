from followthemoney import model
from followthemoney.types import registry

from aleph.model import Collection, Events
from aleph.logic import resolver

from datetime import datetime


class Facet(object):
    def __init__(self, name, aggregations, parser):
        self.name = name
        self.parser = parser
        self.data = self.extract(aggregations, name, "values")
        self.cardinality = self.extract(aggregations, name, "cardinality")
        self.intervals = self.extract(aggregations, name, "intervals")

    def extract(self, aggregations, name, sub):
        if aggregations is None:
            return {}
        aggregations = aggregations.get("%s.filtered" % name, aggregations)
        data = aggregations.get("scoped", {}).get(name, {}).get(name)
        field = "%s.%s" % (name, sub)
        return data or aggregations.get(field, {})

    def expand(self, keys):
        pass

    def update(self, result, key):
        pass

    def to_dict(self):
        active = list(self.parser.filters.get(self.name, []))
        data = {"filters": active}
        if self.parser.get_facet_total(self.name):
            data["total"] = self.cardinality.get("value")

        if self.parser.get_facet_values(self.name):
            results = []
            for bucket in self.data.get("buckets", []):
                key = str(bucket.get("key"))
                results.append(
                    {
                        "id": key,
                        "label": key,
                        "count": bucket.pop("doc_count", 0),
                        "active": key in active,
                    }
                )
                if key in active:
                    active.remove(key)

            for key in active:
                results.insert(0, {"id": key, "label": key, "count": 0, "active": True})

            self.expand([r.get("id") for r in results])
            for result in results:
                self.update(result, result.get("id"))

            data["values"] = results

        if self.parser.get_facet_interval(self.name):
            results = []
            for bucket in self.intervals.get("buckets", []):
                key = str(bucket.get("key_as_string"))
                count = bucket.pop("doc_count", 0)
                results.append(
                    {"id": key, "label": key, "count": count, "active": key in active}
                )
            data["intervals"] = sorted(results, key=lambda k: k["id"])
        return data


class SchemaFacet(Facet):
    def update(self, result, key):
        try:
            result["label"] = model.get(key).plural
        except AttributeError:
            result["label"] = key


class CountryFacet(Facet):
    def update(self, result, key):
        result["label"] = registry.country.names.get(key, key)


class EventFacet(Facet):
    def update(self, result, key):
        event = Events.get(key)
        result["label"] = key if event is None else event.title


class DateFacet(Facet):
    def update(self, result, key):
        timestamp = int(key) / 1000
        result["label"] = datetime.utcfromtimestamp(timestamp).strftime("%Y-%m-%d")


class LanguageFacet(Facet):
    def update(self, result, key):
        result["label"] = registry.language.names.get(key, key)


class CategoryFacet(Facet):
    def update(self, result, key):
        result["label"] = Collection.CATEGORIES.get(key, key)


class CollectionFacet(Facet):
    def expand(self, keys):
        for key in keys:
            if self.parser.authz.can(key, self.parser.authz.READ):
                resolver.queue(self.parser, Collection, key)
        resolver.resolve(self.parser)

    def update(self, result, key):
        collection = resolver.get(self.parser, Collection, key)
        if collection is not None:
            result["label"] = collection.get("label")
            result["category"] = collection.get("category")
