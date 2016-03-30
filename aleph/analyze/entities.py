import re
import six
import logging
import unicodedata
from collections import defaultdict
# from unidecode import unidecode

from aleph.core import db
from aleph.util import latinize_text
from aleph.model import Reference, Selector, Entity, Collection
from aleph.analyze.analyzer import Analyzer

# TODO: cache regexen, perhaps by collection?

log = logging.getLogger(__name__)
BATCH_SIZE = 5000
COLLAPSE = re.compile(r'\s+')
WS = ' '

# Unicode character classes, see:
# http://www.fileformat.info/info/unicode/category/index.htm
CATEGORIES = {
    'C': '',
    'M': ' . ',
    'Z': WS,
    'P': '',
    'S': WS
}


def normalize(text):
    if not isinstance(text, six.string_types):
        return

    if six.PY2 and not isinstance(text, six.text_type):
        text = text.decode('utf-8')

    text = latinize_text(text.lower())
    text = unicodedata.normalize('NFKD', text)
    characters = []
    for character in text:
        category = unicodedata.category(character)[0]
        character = CATEGORIES.get(category, character)
        characters.append(character)
    text = u''.join(characters)

    return COLLAPSE.sub(WS, text).strip(WS)


class EntityCache(object):

    def __init__(self):
        self.collections = {}

    def compile_collection(self, collection_id):
        matchers = defaultdict(set)
        q = db.session.query(Selector.entity_id, Selector.text)
        q = q.join(Entity, Entity.id == Selector.entity_id)
        q = q.filter(Entity.collection_id == collection_id)
        for entity_id, text in q.all():
            text = normalize(text)
            matchers[text].add(entity_id)
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

    def tag_text(self, text, entities):
        text = normalize(text)
        if text is None:
            return
        for rex, matches in self.matchers:
            for match in rex.finditer(text):
                match = match.group(2)
                for entity_id in matches.get(match, []):
                    entities[entity_id] += 1

    def analyze_text(self, document, meta):
        entities = defaultdict(int)
        for page in document.pages:
            self.tag_text(page.text, entities)
        self.save(document, meta, entities)

    def analyze_tabular(self, document, meta):
        entities = defaultdict(int)
        for record in document.records:
            for text in record.data.values():
                self.tag_text(text, entities)
        self.save(document, meta, entities)

    def save(self, document, meta, entities):
        if len(entities):
            log.info("Tagged %r with %d entities", document, len(entities))

        Reference.delete_document(document.id)
        for entity_id, weight in entities.items():
            ref = Reference()
            ref.document_id = document.id
            ref.entity_id = entity_id
            ref.weight = weight
            db.session.add(ref)
        super(EntityAnalyzer, self).save(document, meta)
