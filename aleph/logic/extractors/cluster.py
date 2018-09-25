from Levenshtein import setmedian

from aleph.logic.extractors.util import overlaps


class Cluster(object):

    def __init__(self, result):
        self.result = result
        self.results = [result]

    def match(self, result):
        if self.result.strict or result.strict:
            return self.result.key == result.key \
                and self.result.category == result.category
        for member in self.results:
            if result.key == member.key:
                return True
            if overlaps(result.span, member.span):
                return True
        return False

    def add(self, result):
        self.results.append(result)

    @property
    def label(self):
        if self.result.strict:
            return self.result.label
        labels = [r.label for r in self.results]
        return setmedian(labels)

    @property
    def category(self):
        if self.result.strict:
            return self.result.category
        categories = [r.category for r in self.results]
        return max(set(categories), key=categories.count)

    @property
    def weight(self):
        return len(self.results)
