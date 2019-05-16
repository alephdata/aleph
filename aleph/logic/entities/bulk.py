import logging
from banal import is_mapping
from followthemoney import model
from followthemoney.exc import InvalidData
from followthemoney.pragma import remove_checksums
from followthemoney.namespace import Namespace

from aleph.index import entities as index
from aleph.index.util import BULK_PAGE
from aleph.logic.collections import refresh_collection

log = logging.getLogger(__name__)


def bulk_write(collection, items, merge=True, unsafe=False):
    """Write a set of entities - given as dicts - to the index in bulk
    mode. This will perform validation but is dangerous as it means the
    application has no control over key generation and a few other aspects
    of building the entity.
    """
    namespace = Namespace(collection.foreign_id)
    entities = {}
    for item in items:
        if not is_mapping(item):
            raise InvalidData("Failed to read input data", errors=item)

        entity = model.get_proxy(item)
        if not unsafe:
            entity = namespace.apply(entity)
            entity = remove_checksums(entity)
        entity.context = {
            'bulk': True,
            'collection_id': collection.id
        }
        if entity.id is None:
            raise InvalidData("No ID for entity", errors=item)

        if entity.id in entities:
            entities[entity.id].merge(entity)
        else:
            entities[entity.id] = entity

        if len(entities) >= BULK_PAGE:
            index.index_bulk(collection.id, entities, merge=merge)
            entities = {}

    if len(entities):
        index.index_bulk(collection.id, entities, merge=merge)

    refresh_collection(collection)
