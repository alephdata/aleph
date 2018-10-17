from Levenshtein import setmedian

from aleph.logic.extractors.util import overlaps


class Cluster(object):
    __slots__ = ['strict', 'keys', 'spans', 'labels', 'categories', 'count']

    def __init__(self, result):
        self.strict = result.strict
        self.keys = set([result.key])
        self.spans = set([result.span])
        self.labels = [result.label]
        self.categories = [result.category]
        self.count = 1

    def match(self, result):
        if self.strict or result.strict:
            return result.key in self.keys and \
                   result.category in self.categories
        if result.key in self.keys:
            return True
        for span in self.spans:
            if overlaps(result.span, span):
                return True
        return False

    def add(self, result):
        self.count += 1
        if not self.strict:
            self.keys.add(result.key)
            self.spans.add(result.span)
            self.labels.append(result.label)
            self.categories.append(result.category)

    @property
    def label(self):
        if not self.strict and len(self.labels) > 1:
            return setmedian(self.labels)
        return self.labels[0]

    @property
    def category(self):
        if not self.strict:
            categories = set(self.categories)
            if len(categories) > 1:
                return max(categories, key=self.categories.count)
        return self.categories[0]

    @property
    def weight(self):
        return self.count
