import logging
from followthemoney.namespace import Namespace
from ftmstore import Dataset

log = logging.getLogger(__name__)


def get_aggregator_name(collection):
    return 'collection_%s' % collection.id


def get_aggregator(collection, origin='aleph'):
    """Connect to a followthemoney dataset."""
    return Dataset(get_aggregator_name(collection), origin=origin)


def delete_aggregator_entity(collection, entity_id):
    aggregator = get_aggregator(collection)
    try:
        entity_id = collection.ns.sign(entity_id)
        aggregator.delete(entity_id=entity_id)
        base_id, _ = Namespace.parse(entity_id)
        aggregator.delete(entity_id=base_id)
    finally:
        aggregator.close()


def drop_aggregator(collection, origin=None):
    """Clear all the documents from the dataset."""
    aggregator = get_aggregator(collection)
    try:
        aggregator.delete(origin=origin)
    finally:
        aggregator.close()
