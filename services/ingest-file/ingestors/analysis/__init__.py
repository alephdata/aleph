import logging
from followthemoney import model
from followthemoney.types import registry

from ingestors import settings
from ingestors.analysis.aggregate import TagAggregator
from ingestors.analysis.extract import extract_entities
from ingestors.analysis.patterns import extract_patterns
from ingestors.analysis.language import detect_languages
from ingestors.analysis.util import text_chunks

log = logging.getLogger(__name__)


class Analyzer(object):
    FRAGMENT = 'analysis'

    def __init__(self, dataset, entity, reporter):
        self.dataset = dataset
        self.entity = model.make_entity(entity.schema)
        self.entity.id = entity.id
        self.aggregator = TagAggregator()
        self.reporter = reporter

    def feed(self, entity):
        if not settings.ANALYZE_ENTITIES:
            return
        # TODO: should we have a schema called "Taggable" with
        # the XXmentioned properties?
        if not entity.schema.is_a('Document'):
            return
        # HACK: Tables will be mapped, don't try to tag them here.
        if entity.schema.is_a('Table'):
            return

        self.reporter.start(entity=self.entity.to_dict())

        texts = entity.get_type_values(registry.text)
        for text in text_chunks(texts):
            detect_languages(self.entity, text)
            for (prop, tag) in extract_entities(self.entity, text):
                self.aggregator.add(prop, tag)
            for (prop, tag) in extract_patterns(self.entity, text):
                self.aggregator.add(prop, tag)

    def flush(self):
        for (label, prop) in self.aggregator.entities:
            self.entity.add(prop, label, cleaned=True)

        if len(self.aggregator):
            log.debug("Extracted %d tags: %r",
                      len(self.aggregator), self.entity)
            self.dataset.put(self.entity, self.FRAGMENT)

        self.reporter.end(entity=self.entity.to_dict())
