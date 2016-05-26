import re
import logging
from time import time
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

    def analyze(self, document, meta):
        begin_time = time()
        self.cache.generate()
        entities = defaultdict(int)
        for text, rec in document.text_parts():
            text = normalize_strong(text)
            if text is None or len(text) <= 2:
                continue
            for rex in self.cache.regexes:
                for match in rex.finditer(text):
                    match = match.group(2)
                    # match = match.group(1)
                    for entity_id in self.cache.matches.get(match, []):
                        entities[entity_id] += 1

        Reference.delete_document(document.id, origin=self.origin)
        for entity_id, weight in entities.items():
            ref = Reference()
            ref.document_id = document.id
            ref.entity_id = entity_id
            ref.origin = self.origin
            ref.weight = weight
            db.session.add(ref)
        self.save(document, meta)

        duration_time = int((time() - begin_time) * 1000)
        if len(entities):
            log.info("Regex tagged %r with %d entities (%sms)",
                     document, len(entities), duration_time)
        else:
            log.info("Regex found no entities on %r (%sms)",
                     document, duration_time)
