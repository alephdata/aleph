import logging

from aleph.core import get_graph
from aleph.model import Document
from aleph.graph.schema import DocumentNode, EmailNode, PhoneNode
from aleph.graph.schema import MENTIONS
from aleph.graph.collections import add_to_collections
from aleph.graph.entities import load_entity

log = logging.getLogger(__name__)


def load_documents():
    graph = get_graph()
    tx = graph.begin()
    for i, document in enumerate(Document.all()):
        log.info("Load doc [%s]: %r", document.id, document.meta)
        load_document(tx, document)
        if i > 0 and i % 1000 == 0:
            tx.commit()
            tx = graph.begin()
    tx.commit()


def load_document(tx, document):
    meta = document.meta
    data = {
        'name': meta.title,
        'docType': document.type,
        'fileName': meta.file_name,
        'fingerprint': document.content_hash,
        'alephDocument': document.id
    }
    node = DocumentNode.merge(tx, **data)
    add_to_collections(tx, node, document.collections)

    for email in meta.emails:
        enode = EmailNode.merge(tx, name=email, fingerprint=email)
        MENTIONS.merge(tx, node, enode)
        add_to_collections(tx, enode, document.collections)

    for phone in meta.phone_numbers:
        pnode = PhoneNode.merge(tx, name=phone, fingerprint=phone)
        MENTIONS.merge(tx, node, pnode)
        add_to_collections(tx, pnode, document.collections)

    for reference in document.references:
        if reference.origin == 'polyglot':
            continue
        enode = load_entity(tx, reference.entity)
        MENTIONS.merge(tx, node, enode, weight=reference.weight)
    return node
