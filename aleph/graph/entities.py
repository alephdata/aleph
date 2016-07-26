import logging
import fingerprints
from py2neo import Node, Relationship

from aleph.model import Entity
from aleph.graph.db import get_graph, Vocab
from aleph.graph.collections import load_collection

log = logging.getLogger(__name__)


def load_entities():
    tx = get_graph().begin()
    for entity in Entity.all():
        log.info("Load node [%s]: %s", entity.id, entity.name)
        load_entity(tx, entity)
    tx.commit()


def load_entity(tx, entity):
    data = {
        'name': entity.name,
        'alephState': entity.state,
        'fingerprint': fingerprints.generate(entity.name),
        'alephEntity': entity.id
    }
    if entity.jurisdiction_code is not None:
        data['countryCode'] = entity.jurisdiction_code.upper()
    node = Node(Vocab.Entity, **data)
    tx.merge(node, Vocab.Entity, 'fingerprint')
    for collection in entity.collections:
        coll_node = load_collection(tx, collection)
        rel = Relationship(coll_node, Vocab.CONTAINS, node)
        tx.merge(rel, Vocab.CONTAINS)
    # TODO contact details, addresses
    return node
