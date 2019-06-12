import logging
from Levenshtein import setmedian
from followthemoney.types import registry

from aleph.analysis.util import tag_key


log = logging.getLogger(__name__)


class TagAggregator(object):
    CUTOFFS = {
        registry.country: .2,
        registry.language: .3,
        registry.name: .003,
        registry.phone: .05,
    }

    def __init__(self):
        self.tags = {}
        self.types = {}

    def add(self, type_, tag):
        key = tag_key(tag)
        if key is None:
            return

        if (key, type_) not in self.tags:
            self.tags[(key, type_)] = []
        self.tags[(key, type_)].append(tag)

        if type_ not in self.types:
            self.types[type_] = 0
        self.types[type_] += 1

    def type_cutoff(self, type_):
        freq = self.CUTOFFS.get(type_, 0)
        return self.types.get(type_, 0) * freq

    @property
    def entities(self):
        for (key, type_), tags in self.tags.items():
            # skip entities that do not meet a threshold of relevance:
            cutoff = self.type_cutoff(type_)
            if len(tags) < cutoff:
                continue

            label = tags[0]
            if type_ == registry.name and len(set(tags)) > 0:
                label = setmedian(tags)
            yield label, type_

    def __len__(self):
        return len(self.tags)
