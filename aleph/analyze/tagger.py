import os
import re
import logging
from collections import defaultdict

from loadkit.types.stage import Stage
from loadkit.operators.common import SourceOperator

from aleph.core import db
from aleph.model import EntityTag, Selector

log = logging.getLogger(__name__)


class TaggerOperator(SourceOperator):

    BATCH_SIZE = 5000
    DEFAULT_SOURCE = os.path.join(Stage.GROUP, 'normalized.txt')

    def compile(self, matches):
        body = '|'.join(matches.keys())
        return re.compile('( |^)(%s)( |$)' % body)

    def expressions(self):
        matches = defaultdict(set)
        q = db.session.query(Selector.entity_id, Selector.normalized)
        for i, (entity_id, text) in enumerate(q.yield_per(self.BATCH_SIZE)):
            matches[text].add(entity_id)
            if i > 0 and i % self.BATCH_SIZE == 0:
                yield self.compile(matches), matches
                matches = defaultdict(set)
        if len(matches):
            yield self.compile(matches), matches

    def analyze(self, normalized):
        text = normalized.data()
        EntityTag.delete_set(normalized.package.collection,
                             normalized.package.id)

        entities = set()
        for rex, matches in self.expressions():
            for match in rex.finditer(text):
                _, match, _ = match.groups()
                entities.update(matches[match])

        for entity in entities:
            tag = EntityTag()
            tag.collection = normalized.package.collection
            tag.package_id = normalized.package.id
            tag.entity_id = entity
            db.session.add(tag)

        db.session.commit()

        if len(entities):
            log.info("Tagged %r with %d entities", normalized.package.id,
                     len(entities))
