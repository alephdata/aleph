import logging
from threading import RLock
from collections import defaultdict
from ahocorasick import Automaton, EMPTY

from aleph.core import db, get_config
from aleph.text import match_form
from aleph.model import Reference, Entity
from aleph.analyze.analyzer import Analyzer


log = logging.getLogger(__name__)
lock = RLock()


class AutomatonCache(object):

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
                if term in matches:
                    matches[term].append(entity.id)
                else:
                    matches[term] = [entity.id]


        if not len(matches):
            return

        for term, entities in matches.iteritems():
            self.automaton.add_word(term.encode('utf-8'), entities)
        self.automaton.make_automaton()
        log.info('Generated automaton with %s terms', len(matches))


class AhoCorasickEntityAnalyzer(Analyzer):

    cache = AutomatonCache()
    origin = 'regex'

    def prepare(self):
        if get_config('REGEX_ENTITIES', True):
            self.cache.generate()
            self.entities = defaultdict(int)
        else:
            self.disabled = True

    def on_text(self, text):
        if self.cache.automaton.kind == EMPTY:
            return
        text = match_form(text)
        if text is None or len(text) <= 2:
            return
        text = text.encode('utf-8')
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
