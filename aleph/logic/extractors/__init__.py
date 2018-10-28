import logging

from aleph.core import db, settings
from aleph.model import Document, EntityTag
from aleph.logic.extractors.aggregate import EntityAggregator
from aleph.logic.extractors.util import load_places

log = logging.getLogger(__name__)
ORIGIN = 'ner'


def extract_document_tags(document):
    if document.status != Document.STATUS_SUCCESS:
        return
    load_places()
    log.info("Tagging [%s]: %s", document.id, document.name)

    languages = list(document.languages)
    if not len(languages):
        languages = [settings.DEFAULT_LANGUAGE]

    aggregator = EntityAggregator()
    for text in document.texts:
        aggregator.extract(text, languages)

    count = 0
    for (label, prop, score) in aggregator.entities:
        count += 1
        EntityTag.create(ORIGIN, document.id, prop, label, score)
    log.info("Extracted tags: %s", count)
    db.session.commit()
