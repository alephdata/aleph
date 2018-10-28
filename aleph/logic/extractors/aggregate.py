import logging
from followthemoney.types import registry

from aleph.logic.extractors.extract import extract_entities
from aleph.logic.extractors.patterns import extract_patterns
from aleph.logic.extractors.result import CountryResult
from aleph.logic.extractors.cluster import Cluster


log = logging.getLogger(__name__)


class EntityAggregator(object):
    CUTOFFS = {
        registry.country: .2,
        registry.language: .3,
        registry.name: .003,
        registry.phone: .05,
    }

    def __init__(self):
        self.clusters = []
        self.record = 0

    def extract(self, text, languages):
        if text is None:
            return
        self.record += 1
        if self.record % 1000 == 0:
            log.debug("%s text parts...", self.record)
        for result in extract_entities(self, text, languages):
            self.add(result)
        for result in extract_patterns(self, text):
            self.add(result)

    def add(self, result):
        if result.key is None:
            return

        if not isinstance(result, CountryResult):
            for country in result.countries:
                self.add(CountryResult.create(self, country, None, None))

        # only using locations for country detection at the moment:
        if result.prop.type == registry.address:
            return

        for cluster in self.clusters:
            if cluster.match(result):
                return cluster.add(result)
        self.clusters.append(Cluster(result))

    def prop_weight(self, prop):
        weights = [c.weight for c in self.clusters if c.prop == prop]
        return sum(weights)

    def prop_cutoff(self, prop):
        freq = self.CUTOFFS.get(prop.type)
        if freq is None:
            return 0
        weights = [c.weight for c in self.clusters if c.prop == prop]
        return sum(weights) * freq

    @property
    def countries(self):
        cutoff = self.prop_cutoff(registry.country)
        for cluster in self.clusters:
            if not cluster.result.strict:
                continue
            if cluster.prop.type != registry.country:
                continue
            if cluster.weight < cutoff:
                continue
            yield cluster.label

    @property
    def entities(self):
        weights = {}
        for cluster in self.clusters:
            # skip entities that do not meet a threshold of relevance:
            prop = cluster.prop
            freq = self.CUTOFFS.get(prop.type)
            if freq is None:
                yield cluster.label, prop, 1.0
                continue

            if prop not in weights:
                weights[prop] = self.prop_weight(prop)
            cutoff = weights[prop] * freq
            if cluster.weight < cutoff:
                continue

            # log.debug('%s (%s): %s', cluster.label, cluster.category, cluster.weight)  # noqa
            score = (cluster.weight / weights[prop])
            yield cluster.label, cluster.prop, score

    def __len__(self):
        return len(self.clusters)
