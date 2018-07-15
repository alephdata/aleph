from entityextractor.extract import extract_polyglot, extract_spacy
from entityextractor.normalize import clean_label, label_key
from entityextractor.normalize import select_label
from entityextractor.util import overlaps


class EntityGroup(object):

    def __init__(self, label, key, category, span):
        self.labels = [label]
        self.categories = [category]
        self.keys = set([key])
        self.spans = set([span])

    def match(self, key, span):
        if key in self.keys:
            return True
        for crit in self.spans:
            if overlaps(span, crit):
                return True
        # TODO: could also do some token-based magic here??
        return False

    def add(self, label, key, category, span):
        self.labels.append(label)
        self.categories.append(category)
        self.keys.add(key)
        self.spans.add(span)

    @property
    def label(self):
        return select_label(self.labels)

    @property
    def category(self):
        return max(set(self.categories), key=self.categories.count)

    @property
    def weight(self):
        return len(self.labels)


class EntityAggregator(object):

    def __init__(self):
        self.groups = []

    def extract(self, text, languages):
        for language in languages:
            for (l, c, s, e) in extract_polyglot(text, language):
                self.feed(l, c, (s, e))
            for (l, c, s, e) in extract_spacy(text, language):
                self.feed(l, c, (s, e))

    def feed(self, label, category, span):
        label = clean_label(label)
        if label is None:
            return
        key = label_key(label)
        if key is None:
            return
        for group in self.groups:
            if group.match(key, span):
                group.add(label, key, category, span)
                return
        group = EntityGroup(label, key, category, span)
        self.groups.append(group)

    @property
    def entities(self):
        for group in self.groups:
            yield group.label, group.category, group.weight

    def __len__(self):
        return len(self.groups)
