import logging

from aleph.model import DocumentTag
from aleph.logic.extractors.extract import extract_entities
from aleph.logic.extractors.patterns import extract_patterns
from aleph.logic.extractors.result import CountryResult
from aleph.logic.extractors.cluster import Cluster


log = logging.getLogger(__name__)


class EntityAggregator(object):
    CUTOFFS = {
        DocumentTag.TYPE_COUNTRY: .2,
        DocumentTag.TYPE_LANGUAGE: .3,
        DocumentTag.TYPE_ORGANIZATION: .003,
        DocumentTag.TYPE_PERSON: .003,
        DocumentTag.TYPE_PHONE: .05,
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
        if result.category == DocumentTag.TYPE_LOCATION:
            return

        for cluster in self.clusters:
            if cluster.match(result):
                return cluster.add(result)
        self.clusters.append(Cluster(result))

    def category_cutoff(self, category):
        freq = self.CUTOFFS.get(category)
        if freq is None:
            return 0
        weights = [c.weight for c in self.clusters if c.category == category]
        return sum(weights) * freq

    @property
    def countries(self):
        cutoff = self.category_cutoff(DocumentTag.TYPE_COUNTRY)
        for cluster in self.clusters:
            if not cluster.result.strict:
                continue
            if cluster.category != DocumentTag.TYPE_COUNTRY:
                continue
            if cluster.weight < cutoff:
                continue
            yield cluster.label

    @property
    def entities(self):
        for cluster in self.clusters:
            # skip entities that do not meet a threshold of relevance:
            cutoff = self.category_cutoff(cluster.category)
            if cluster.weight < cutoff:
                continue

            # log.debug('%s (%s): %s', cluster.label, cluster.category, cluster.weight)  # noqa
            yield cluster.label, cluster.category, cluster.weight

    def __len__(self):
        return len(self.clusters)
