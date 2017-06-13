import logging
from threading import RLock
from ahocorasick import Automaton, EMPTY

from aleph.core import get_config
from aleph.text import match_form
from aleph.model import Entity
from aleph.analyze.analyzer import Analyzer
from aleph.model import DocumentTag, DocumentTagCollector


log = logging.getLogger(__name__)
lock = RLock()


class AutomatonCache(object):

    TYPES = {
        'Person': DocumentTag.TYPE_PERSON,
        'Organization': DocumentTag.TYPE_ORGANIZATION,
        'Company': DocumentTag.TYPE_ORGANIZATION,
        'LegalEntity': DocumentTag.TYPE_PERSON,
    }

    def __init__(self):
        self.latest = None
        self.automaton = Automaton()
        self.matches = {}

    def generate(self):
        with lock:
            self._generate()

    def _generate(self):
        latest = Entity.latest()
        if latest is None:
            return
        if self.latest is not None and self.latest >= latest:
            return
        self.latest = latest

        matches = {}
        q = Entity.all()
        q = q.filter(Entity.state == Entity.STATE_ACTIVE)
        for entity in q:
            for term in entity.regex_terms:
                type_ = self.TYPES.get(entity.type)
                if type_ is None:
                    continue
                if term in matches:
                    matches[term].append((entity.name, type_))
                else:
                    matches[term] = [(entity.name, type_)]

        if not len(matches):
            return

        for term, entities in matches.iteritems():
            self.automaton.add_word(term.encode('utf-8'), entities)
        self.automaton.make_automaton()
        log.info('Generated automaton with %s terms', len(matches))


class AhoCorasickEntityAnalyzer(Analyzer):
    ORIGIN = 'regex'
    MIN_LENGTH = 100

    cache = AutomatonCache()

    def prepare(self):
        self.disabled = not get_config('REGEX_ENTITIES', True)
        if not self.disabled:
            self.cache.generate()
        self.collector = DocumentTagCollector(self.document, self.ORIGIN)

    def on_text(self, text):
        if self.cache.automaton.kind == EMPTY:
            return
        if text is None or len(text) <= self.MIN_LENGTH:
            return
        text = match_form(text)
        if text is None or len(text) <= self.MIN_LENGTH:
            return
        text = text.encode('utf-8')
        for match in self.cache.automaton.iter(text):
            for (text, type) in match[1]:
                self.collector.emit(text, type)

    def finalize(self):
        log.info('Aho Corasick extraced %s entities.', len(self.collector))
        self.collector.save()
