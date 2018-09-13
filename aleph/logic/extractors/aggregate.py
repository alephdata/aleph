import logging
from banal import ensure_list
from collections import Counter

from aleph.model import DocumentTag
from aleph.logic.extractors.extract import extract_polyglot, extract_spacy
from aleph.logic.extractors.patterns import extract_patterns
from aleph.logic.extractors.cluster import Cluster


log = logging.getLogger(__name__)


class EntityAggregator(object):
    MAX_COUNTRIES = 10
    CUTOFF = 0.01

    def __init__(self):
        self.clusters = []
        self._countries = Counter()
        self.record = 0

    def extract(self, text, languages):
        self.record += 1
        for result in extract_polyglot(self, text, languages):
            self.add(result)
        for result in extract_spacy(self, text, languages):
            self.add(result)
        for result in extract_patterns(self, text):
            self.add(result)

    def add(self, result):
        log.info('Extract: [%s] (%r)', result.label, result.countries)
        countries = [c.lower() for c in ensure_list(result.countries)]
        self._countries.update(countries)
        if not result.valid:
            return
        # TODO: make a hash?
        for cluster in self.clusters:
            if cluster.match(result):
                return cluster.add(result)
        self.clusters.append(Cluster(result))

    @property
    def countries(self):
        cs = self._countries.most_common(n=self.MAX_COUNTRIES)
        return [c for (c, n) in cs]

    @property
    def entities(self):
        total_weight = sum([c.weight for c in self.clusters if not c.strict])
        total_weight = float(max(1, total_weight))
        for cluster in self.clusters:
            # only using locations for country detection at the moment:
            if cluster.category == DocumentTag.TYPE_LOCATION:
                continue

            # skip entities that do not meet a threshold of relevance:
            # if not cluster.strict:
            #     if (cluster.weight / total_weight) < self.CUTOFF:
            #         continue

            # log.info('%s: %s: %s', group.label, group.category, group.weight)
            yield cluster.label, cluster.category, cluster.weight

        for (country, weight) in self._countries.items():
            yield country, DocumentTag.TYPE_COUNTRY, weight

    def __len__(self):
        return len(self.clusters)
