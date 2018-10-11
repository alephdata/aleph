import logging

from aleph.core import db, settings
from aleph.model import Document, DocumentTagCollector
from aleph.logic.extractors.aggregate import EntityAggregator

log = logging.getLogger(__name__)


def extract_document_tags(document):
    if document.status != Document.STATUS_SUCCESS:
        return
    log.info("Tagging [%s]: %s", document.id, document.name)

    languages = list(document.languages)
    if not len(languages):
        languages = [settings.DEFAULT_LANGUAGE]

    aggregator = EntityAggregator()
    for text in document.texts:
        aggregator.extract(text, languages)

    DocumentTagCollector(document, 'polyglot').save()
    DocumentTagCollector(document, 'spacy').save()
    collector = DocumentTagCollector(document, 'ner')
    for (label, category, weight) in aggregator.entities:
        collector.emit(label, category, weight=weight)
    log.info("Extracted tags: %s", len(collector))
    collector.save()
    db.session.add(document)
    db.session.commit()
