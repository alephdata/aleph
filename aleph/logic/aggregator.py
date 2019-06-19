import logging
import balkhash

log = logging.getLogger(__name__)


def get_aggregator_name(collection):
    return 'collection_%s' % collection.id


def get_aggregator(collection):
    """Connect to a balkhash dataset."""
    return balkhash.init(get_aggregator_name(collection))


def drop_aggregator(collection):
    """Clear all the documents from the balkhash dataset."""
    aggregator = get_aggregator(collection)
    try:
        aggregator.delete()
    finally:
        aggregator.close()
