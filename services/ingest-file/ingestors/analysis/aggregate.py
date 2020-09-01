import logging
from collections import defaultdict

from ingestors.analysis.util import TAG_COUNTRY, TAG_PHONE
from ingestors.analysis.util import TAG_PERSON, TAG_COMPANY

log = logging.getLogger(__name__)


class TagAggregator(object):
    MAX_TAGS = 10000
    CUTOFFS = {
        TAG_COUNTRY: 0.3,
        TAG_PERSON: 0.03,
        TAG_COMPANY: 0.03,
        TAG_PHONE: 0.05,
    }

    def __init__(self):
        self.values = defaultdict(list)
        self.types = defaultdict(int)

    def add(self, prop, value):
        key = prop.type.node_id_safe(value)
        if key is None:
            return

        if (key, prop) not in self.values:
            if len(self.values) > self.MAX_TAGS:
                return
        self.values[(key, prop)].append(value)
        self.types[prop] += 1

    def prop_cutoff(self, prop):
        freq = self.CUTOFFS.get(prop, 0)
        return self.types.get(prop, 0) * freq

    def results(self):
        for (key, prop), values in self.values.items():
            # skip entities that do not meet a threshold of relevance:
            cutoff = self.prop_cutoff(prop)
            if len(values) < cutoff:
                continue
            yield (key, prop, values)

    def __len__(self):
        return len(self.values)
