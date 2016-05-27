import re
import logging
from threading import RLock
from itertools import count
from collections import defaultdict
from sqlalchemy.orm import joinedload

from aleph.core import db
from aleph.text import normalize_strong
from aleph.model import Reference, Entity
from aleph.analyze.analyzer import Analyzer


log = logging.getLogger(__name__)
lock = RLock()
BATCH_SIZE = 1000


class EntityCache(object):

    def __init__(self):
        self.latest = None
        self.matches = {}
        self.regexes = []

    def generate(self):
        with lock:
            self._generate()

    def _generate(self):
        latest = Entity.latest()
        if self.latest is not None and self.latest >= latest:
            return

        self.latest = latest
        self.matches = defaultdict(set)

        q = Entity.all()
        q = q.options(joinedload('other_names'))
        q = q.filter(Entity.state == Entity.STATE_ACTIVE)
        for entity in q:
            for term in entity.regex_terms:
                self.matches[normalize_strong(term)].add(entity.id)

        self.regexes = []
        terms = self.matches.keys()
        terms = [t for t in terms if len(t) > 2]
        for i in count(0):
            terms_slice = terms[i * BATCH_SIZE:(i + 1) * BATCH_SIZE]
            if not len(terms_slice):
                break
            body = '|'.join(terms_slice)
            rex = re.compile('( |^)(%s)( |$)' % body)
            # rex = re.compile('(%s)' % body)
            self.regexes.append(rex)

        log.info('Generating entity tagger: %r (%s terms)',
                 latest, len(terms))


class RegexEntityAnalyzer(Analyzer):

    cache = EntityCache()
    origin = 'regex'

    def prepare(self):
        self.cache.generate()
        self.entities = defaultdict(int)

    def on_text(self, text):
        text = normalize_strong(text)
        if text is None or len(text) <= 2:
            return
        for rex in self.cache.regexes:
            for match in rex.finditer(text):
                match = match.group(2)
                for entity_id in self.cache.matches.get(match, []):
                    self.entities[entity_id] += 1

    def finalize(self):
        Reference.delete_document(self.document.id, origin=self.origin)
        for entity_id, weight in self.entities.items():
            ref = Reference()
            ref.document_id = self.document.id
            ref.entity_id = entity_id
            ref.origin = self.origin
            ref.weight = weight
            db.session.add(ref)
        log.info('Regex extraced %s entities.', len(self.entities))
