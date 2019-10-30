import logging
from Levenshtein import setmedian

from aleph.analysis.util import tag_key
from aleph.analysis.util import TAG_COUNTRY, TAG_LANGUAGE, TAG_PHONE
from aleph.analysis.util import TAG_PERSON, TAG_COMPANY


log = logging.getLogger(__name__)


class TagAggregator(object):
    MAX_TAGS = 10000
    CUTOFFS = {
        TAG_COUNTRY: .2,
        TAG_LANGUAGE: .3,
        TAG_PERSON: .003,
        TAG_COMPANY: .003,
        TAG_PHONE: .05,
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
            if len(self.types) > self.MAX_TAGS:
                return
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
            if type_ in (TAG_COMPANY, TAG_PERSON) and len(set(tags)) > 0:
                label = setmedian(tags)
            yield label, type_

    def __len__(self):
        return len(self.tags)
