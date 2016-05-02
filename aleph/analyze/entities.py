import re
import logging
from threading import RLock
from itertools import count
from collections import defaultdict
# from unidecode import unidecode

from aleph.core import db
from aleph.util import normalize_strong
from aleph.model import Reference, Entity
from aleph.analyze.analyzer import Analyzer


log = logging.getLogger(__name__)
lock = RLock()
BATCH_SIZE = 5000


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

        log.info('Generating entity tagger: %r', latest)
        self.latest = latest
        self.matches = defaultdict(set)

        for entity in Entity.all():
            for term in entity.terms:
                self.matches[normalize_strong(term)].add(entity.id)

        self.regexes = []
        terms = self.matches.keys()
        for i in count(0):
            terms_slice = terms[i * BATCH_SIZE:(i + 1) * BATCH_SIZE]
            if not len(terms_slice):
                break
            body = '|'.join(terms_slice)
            rex = re.compile('( |^)(%s)( |$)' % body)
            self.regexes.append(rex)


class EntityAnalyzer(Analyzer):

    cache = EntityCache()

    def analyze(self, document, meta):
        self.cache.generate()
        entities = defaultdict(int)
        for text, rec in document.text_parts():
            text = normalize_strong(text)
            if text is None or not len(text):
                continue
            for rex in self.cache.regexes:
                for match in rex.finditer(text):
                    match = match.group(2)
                    for entity_id in self.cache.matches.get(match, []):
                        entities[entity_id] += 1

        if len(entities):
            log.info("Tagged %r with %d entities", document, len(entities))

        Reference.delete_document(document.id)
        for entity_id, weight in entities.items():
            ref = Reference()
            ref.document_id = document.id
            ref.entity_id = entity_id
            ref.weight = weight
            db.session.add(ref)
        self.save(document, meta)
