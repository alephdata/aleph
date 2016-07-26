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
        'alephEntity': entity.id,
        'isAlias': False
    }
    if entity.jurisdiction_code is not None:
        data['countryCode'] = entity.jurisdiction_code.upper()
    node = Node(Vocab.Entity, **data)
    tx.merge(node, Vocab.Entity, 'fingerprint')
    for collection in entity.collections:
        coll_node = load_collection(tx, collection)
        rel = Relationship(coll_node, Vocab.CONTAINS, node)
        tx.merge(rel, Vocab.CONTAINS)

    fps = set([data['fingerprint']])
    for other_name in entity.other_names:
        fp = fingerprints.generate(other_name.display_name)
        if fp in fps:
            continue
        fps.add(fp)
        alias = Node(Vocab.Entity, name=other_name.display_name,
                     fingerpint=fp, alephEntity=entity.id,
                     isAlias=True, alephState=entity.state,
                     countryCode=data.get('countryCode'))
        tx.merge(alias, Vocab.Entity, 'fingerprint')
        rel = Relationship(node, Vocab.AKA, alias)
        tx.merge(rel, Vocab.AKA)

    # TODO contact details, addresses
    return node
