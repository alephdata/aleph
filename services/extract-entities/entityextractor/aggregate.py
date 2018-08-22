import logging
from banal import ensure_list
from collections import Counter
from alephclient.services.entityextract_pb2 import ExtractedEntity

from entityextractor.extract import extract_polyglot, extract_spacy
from entityextractor.patterns import extract_patterns
from entityextractor.cluster import Cluster


log = logging.getLogger(__name__)


class EntityAggregator(object):
    MAX_COUNTRIES = 3

    def __init__(self):
        self.clusters = []
        self._countries = Counter()
        self.record = 0

    def extract(self, text, languages):
        self.record += 1
        for language in languages:
            for result in extract_polyglot(self, text, language, self.record):
                self.add(result)
            for result in extract_spacy(self, text, language, self.record):
                self.add(result)
        for result in extract_patterns(self, text, self.record):
            self.add(result)

    def add(self, result):
        self._countries.update(ensure_list(result.countries))
        # TODO: make a hash?
        for cluster in self.clusters:
            if cluster.match(result):
                return cluster.add(result)
        self.clusters.append(Cluster(result))

    @property
    def countries(self):
        return [c for (c, n) in Counter.most_common(n=self.MAX_COUNTRIES)]

    @property
    def entities(self):
        for cluster in self.clusters:
            # log.info('%s: %s: %s', group.label, group.category, group.weight)
            yield cluster.label, cluster.category, cluster.weight

        for (country, weight) in self._countries.items():
            yield country, ExtractedEntity.COUNTRY, weight

    def __len__(self):
        return len(self.clusters)
