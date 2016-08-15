import logging

from aleph.graph.schema import CollectionNode, PART_OF

log = logging.getLogger(__name__)


def load_collection(tx, collection):
    if tx is None:
        return
    node = CollectionNode.get_cache(tx, collection.foreign_id)
    if node is not None:
        return node
    node = CollectionNode.merge(tx, name=collection.label,
                                fingerprint=collection.foreign_id,
                                alephCollection=collection.id)
    return node


def remove_collection(tx, collection_id):
    if tx is None:
        return
    query = "MATCH ()-[r {alephCollection: {id}}]-() DELETE r;"
    tx.run(query, id=collection_id)


def add_to_collections(tx, node, collections, **kw):
    for collection in collections:
        coll = load_collection(tx, collection)
        PART_OF.merge(tx, node, coll, alephCollection=collection.id, **kw)
