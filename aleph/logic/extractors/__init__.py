import logging

from aleph.core import db, settings
from aleph.model import Document, DocumentTag, DocumentTagCollector
from aleph.logic.extractors.aggregate import EntityAggregator

log = logging.getLogger(__name__)


def extract_document_tags(document):
    if document.status != Document.STATUS_SUCCESS:
        return
    log.info("NER [%s]: %s", document.id, document.name)

    languages = list(document.languages)
    if not len(languages):
        languages = [settings.DEFAULT_LANGUAGE]

    aggregator = EntityAggregator()
    for text in document.texts:
        if text is None:
            continue
        aggregator.extract(text, languages)

    # DocumentTagCollector(document, 'polyglot').save()
    # DocumentTagCollector(document, 'spacy').save()
    collector = DocumentTagCollector(document, 'ner')
    for (label, category, weight) in aggregator.entities:
        if category == DocumentTag.TYPE_LOCATION:
            continue
        collector.emit(label, category, weight=weight)
    collector.save()
    db.session.add(document)
    db.session.commit()
