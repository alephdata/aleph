import logging
from normality import normalize
from ahocorasick import Automaton

from aleph import settings
from aleph.model import Entity
from aleph.analyze.analyzer import EntityAnalyzer
from aleph.model import DocumentTag

log = logging.getLogger(__name__)


class AhoCorasickEntityAnalyzer(EntityAnalyzer):
    ORIGIN = 'corasick'
    MIN_LENGTH = 20
    TYPES = {
        'Person': DocumentTag.TYPE_PERSON,
        'Organization': DocumentTag.TYPE_ORGANIZATION,
        'Company': DocumentTag.TYPE_ORGANIZATION,
        'LegalEntity': DocumentTag.TYPE_PERSON,
    }

    def __init__(self):
        self.active = settings.ANALYZE_CORASICK
        if self.active:
            # This is technically incorrect because database entities can be 
            # added at any time and the automaton here will not be updated.
            # In earlier versions of Aleph there used to be a lot of code to
            # make sure this was always the latest version. It produced a lot
            # of overhead, while the workers are restarted every couple of
            # minutes anyway -- so: meh.
            self.automaton = self.build_automaton()

    def match_form(self, text):
        """Turn a string into a form appropriate for name matching."""
        # The goal of this function is not to retain a readable version of the
        # string, but rather to yield a normalised version suitable for
        # comparisons and machine analysis.
        text = normalize(text, lowercase=True, latinize=True)
        if text is None:
            return
        # TODO: this is a weird heuristic, but to avoid overly aggressive
        # matching it may make sense:
        if ' ' not in text:
            return
        return text

    def build_automaton(self):
        q = Entity.all()
        q = q.filter(Entity.schema.in_(list(self.TYPES.keys())))

        matches = {}
        for entity in q:
            tag = self.TYPES.get(entity.schema)
            if tag is None:
                continue
            for name in entity.names:
                if name is None or len(name) > 120:
                    continue
                match = self.match_form(name)
                if match is None:
                    continue
                if match in matches:
                    matches[match].append((name, tag))
                else:
                    matches[match] = [(name, tag)]

        if not len(matches):
            return

        automaton = Automaton()
        for term, entities in matches.items():
            automaton.add_word(term, entities)
        automaton.make_automaton()
        return automaton

    def extract(self, collector, document):
        if self.automaton is None:
            return

        for text in document.texts:
            if len(text) <= self.MIN_LENGTH:
                continue
            text = self.match_form(text)
            if text is None:
                continue
            for match in self.automaton.iter(text):
                for (match_text, tag) in match[1]:
                    collector.emit(match_text, tag)

        if len(collector):
            log.info('Aho Corasick extraced %s entities.', len(collector))
