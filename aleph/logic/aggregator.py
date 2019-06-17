import logging
import balkhash

log = logging.getLogger(__name__)


def get_aggregator(collection):
    """Connect to a balkhash dataset."""
    return balkhash.init(collection.foreign_id)


def drop_aggregator(collection):
    """Clear all the documents from the balkhash dataset."""
    aggregator = get_aggregator(collection)
    try:
        aggregator.delete()
    finally:
        aggregator.close()
