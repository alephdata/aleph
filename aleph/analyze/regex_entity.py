import logging
from threading import RLock
from collections import defaultdict
from sqlalchemy.orm import joinedload
from ahocorasick import Automaton

from aleph.core import db
from aleph.text import normalize_strong
from aleph.model import Reference, Entity
from aleph.analyze.analyzer import Analyzer


log = logging.getLogger(__name__)
lock = RLock()


class AutomatonCache(object):

    def __init__(self):
        self.latest = None
        self.matches = {}

    def generate(self):
        with lock:
            self._generate()

    def _generate(self):
        latest = Entity.latest()
        if self.latest is not None and self.latest >= latest:
            return
        self.latest = latest

        matches = defaultdict(set)
        q = Entity.all()
        q = q.options(joinedload('other_names'))
        q = q.filter(Entity.state == Entity.STATE_ACTIVE)
        for entity in q:
            for term in entity.regex_terms:
                matches[term].add(entity.id)

        if not len(matches):
            self.automaton = None
            return

        self.automaton = Automaton()
        for term, entities in matches.items():
            self.automaton.add_word(term.encode('utf-8'), entities)
        self.automaton.make_automaton()
        log.info('Generated automaton with %s terms', len(matches))


class AhoCorasickEntityAnalyzer(Analyzer):

    cache = AutomatonCache()
    origin = 'regex'

    def prepare(self):
        self.cache.generate()
        self.entities = defaultdict(int)

    def on_text(self, text):
        if self.cache.automaton is None:
            return
        text = normalize_strong(text)
        if text is None or len(text) <= 2:
            return
        text = ' %s ' % text.encode('utf-8')
        for match in self.cache.automaton.iter(text):
            for entity_id in match[1]:
                self.entities[entity_id] += 1

    def finalize(self):
        self.document.delete_references(origin=self.origin)
        for entity_id, weight in self.entities.items():
            ref = Reference()
            ref.document_id = self.document.id
            ref.entity_id = entity_id
            ref.origin = self.origin
            ref.weight = weight
            db.session.add(ref)
        log.info('Aho Corasick extraced %s entities.', len(self.entities))
