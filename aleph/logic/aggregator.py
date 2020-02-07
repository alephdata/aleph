import logging
import balkhash
from followthemoney.namespace import Namespace

log = logging.getLogger(__name__)


def get_aggregator_name(collection):
    return 'collection_%s' % collection.id


def get_aggregator(collection):
    """Connect to a balkhash dataset."""
    return balkhash.init(get_aggregator_name(collection))


def delete_aggregator_entity(collection, entity_id):
    aggregator = get_aggregator(collection)
    try:
        entity_id = collection.ns.sign(entity_id)
        aggregator.delete(entity_id=entity_id)
        base_id, _ = Namespace.parse(entity_id)
        aggregator.delete(entity_id=base_id)
    finally:
        aggregator.close()


def drop_aggregator(collection):
    """Clear all the documents from the balkhash dataset."""
    aggregator = get_aggregator(collection)
    try:
        aggregator.delete()
    finally:
        aggregator.close()
