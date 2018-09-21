import logging
from banal import ensure_list

from aleph.model import DocumentTag
from aleph.logic.extractors.extract import extract_polyglot, extract_spacy
from aleph.logic.extractors.patterns import extract_patterns
from aleph.logic.extractors.result import CountryResult
from aleph.logic.extractors.cluster import Cluster


log = logging.getLogger(__name__)


class EntityAggregator(object):
    CUTOFFS = {
        DocumentTag.TYPE_COUNTRY: .3,
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
        for result in extract_polyglot(self, text, languages):
            self.add(result)
        for result in extract_spacy(self, text, languages):
            self.add(result)
        for result in extract_patterns(self, text):
            self.add(result)

    def add(self, result):
        if result.key is None:
            return
        # TODO: make a hash?
        for cluster in self.clusters:
            if cluster.match(result):
                return cluster.add(result)
        # log.debug('Extract [%s] (%s, %r)',
        #           result.label,
        #           result.category,
        #           result.countries)
        for country in ensure_list(result.countries):
            self.add(CountryResult(self, country, 0, 1))
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
            if not cluster.strict:
                continue
            if cluster.category != DocumentTag.TYPE_COUNTRY:
                continue
            if cluster.weight < cutoff:
                continue
            yield cluster.label

    @property
    def entities(self):
        total_weight = sum([c.weight for c in self.clusters if not c.strict])
        total_weight = float(max(1, total_weight))
        for cluster in self.clusters:
            # only using locations for country detection at the moment:
            if cluster.category == DocumentTag.TYPE_LOCATION:
                continue

            # skip entities that do not meet a threshold of relevance:
            cutoff = self.category_cutoff(cluster.category)
            if cluster.weight < cutoff:
                continue

            # log.info('%s: %s: %s', group.label, group.category, group.weight)
            yield cluster.label, cluster.category, cluster.weight

    def __len__(self):
        return len(self.clusters)
