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
        load_entity(tx, entity)
    tx.commit()


def load_entity(tx, entity):
    log.info("Load node [%s]: %s", entity.id, entity.name)
    node = Node(Vocab.Entity,
                fingerprint=fingerprints.generate(entity.name),
                name=entity.name,
                alephState=entity.state,
                alephEntity=entity.id)
    if entity.jurisdiction_code is not None:
        node['countryCode'] = entity.jurisdiction_code.upper()

    tx.merge(node, Vocab.Entity, 'fingerprint')
    for collection in entity.collections:
        coll_node = load_collection(tx, collection)
        rel = Relationship(node, Vocab.PART_OF, coll_node,
                           alephEntity=entity.id)
        tx.merge(rel, Vocab.PART_OF)

    seen = set([node['fingerprint']])
    for other_name in entity.other_names:
        fingerprint = fingerprints.generate(other_name.display_name)
        if fingerprint in seen or fingerprint is None:
            continue
        seen.add(fingerprint)

        alias = Node(Vocab.Entity,
                     fingerprint=fingerprint,
                     name=other_name.display_name,
                     alephEntity=entity.id,
                     isAlias=True)
        tx.merge(alias, Vocab.Entity, 'fingerprint')
        rel = Relationship(node, Vocab.AKA, alias,
                           alephId=other_name.id)
        tx.merge(rel, Vocab.AKA, 'alephId')
    # TODO contact details, addresses
    return node
