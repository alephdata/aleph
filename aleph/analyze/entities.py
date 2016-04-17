import re
import logging
from collections import defaultdict
# from unidecode import unidecode

from aleph.core import db
from aleph.util import normalize_strong
from aleph.model import Reference, Entity, Collection
from aleph.analyze.analyzer import Analyzer

# TODO: cache regexen, perhaps by collection?

log = logging.getLogger(__name__)
BATCH_SIZE = 5000


class EntityCache(object):

    def __init__(self):
        self.collections = {}

    def compile_collection(self, collection_id):
        matchers = defaultdict(set)
        q = db.session.query(Entity)
        q = q.filter(Entity.collection_id == collection_id)
        q = q.filter(Entity.deleted_at == None)  # noqa
        for entity in q:
            for term in entity.terms:
                matchers[normalize_strong(term)].add(entity.id)
        body = '|'.join(matchers.keys())
        rex = re.compile('( |^)(%s)( |$)' % body)
        return rex, matchers

    def matchers(self):
        timestamps = Collection.timestamps()
        for ts in self.collections.keys():
            if ts not in timestamps:
                self.collections.pop(ts, None)

        for ts in timestamps:
            if ts not in self.collections:
                log.info('Entity tagger updating collection: %r', ts)
                self.collections[ts] = self.compile_collection(ts[0])

        return self.collections.values()


class EntityAnalyzer(Analyzer):

    cache = EntityCache()

    @property
    def matchers(self):
        if not hasattr(self, '_matchers'):
            self._matchers = self.cache.matchers()
        return self._matchers

    def analyze(self, document, meta):
        entities = defaultdict(int)
        for text, rec in document.text_parts():
            text = normalize_strong(text)
            if text is None or not len(text):
                continue
            for rex, matches in self.matchers:
                for match in rex.finditer(text):
                    match = match.group(2)
                    for entity_id in matches.get(match, []):
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
