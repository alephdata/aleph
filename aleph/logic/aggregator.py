import logging
from ftmstore import Dataset

log = logging.getLogger(__name__)


def get_aggregator_name(collection):
    return "collection_%s" % collection.id


def get_aggregator(collection, origin="aleph"):
    """Connect to a followthemoney dataset."""
    return Dataset(get_aggregator_name(collection), origin=origin)
