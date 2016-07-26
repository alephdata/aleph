import logging
from py2neo import Node, Relationship

from aleph.model import Document
from aleph.graph.db import get_graph, Vocab
from aleph.graph.collections import load_collection
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
        'alephDocument': document.id
    }
    node = Node(Vocab.Document, **data)
    tx.merge(node, Vocab.Document, 'alephDocument')
    for collection in document.collections:
        coll_node = load_collection(tx, collection)
        rel = Relationship(coll_node, Vocab.CONTAINS, node)
        tx.merge(rel, Vocab.CONTAINS)
    for email in meta.emails:
        cnode = Node(Vocab.Email, name=email, fingerprint=email)
        tx.merge(cnode, Vocab.Email, 'fingerprint')
        rel = Relationship(node, Vocab.MENTIONS, cnode)
        tx.merge(rel, Vocab.MENTIONS)
    for phone in meta.phone_numbers:
        cnode = Node(Vocab.Phone, name=phone, fingerprint=phone)
        tx.merge(cnode, Vocab.Phone, 'fingerprint')
        rel = Relationship(node, Vocab.MENTIONS, cnode)
        tx.merge(rel, Vocab.MENTIONS)
    for reference in document.references:
        enode = load_entity(tx, reference.entity)
        rel = Relationship(node, Vocab.MENTIONS, enode,
                           weight=reference.weight,
                           origin=reference.origin)
        tx.merge(rel, Vocab.MENTIONS)
    return node
