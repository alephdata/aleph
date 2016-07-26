import logging
from py2neo import Node

from aleph.model import Collection
from aleph.graph.db import get_graph, Vocab

log = logging.getLogger(__name__)


def load_collections():
    tx = get_graph().begin()
    for collection in Collection.all():
        log.info("Index collection: %s", collection.label)
        load_collection(tx, collection)
    tx.commit()


def load_collection(tx, collection):
    node = Node(Vocab.Collection, name=collection.label,
                alephCollection=collection.id)
    tx.merge(node, Vocab.Collection, 'alephCollection')
    return node
