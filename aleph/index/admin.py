import logging
from pprint import pprint, pformat  # noqa

from aleph.core import es
from aleph.index.indexes import entities_read_index, configure_entities
from aleph.index.collections import collections_index, configure_collections
from aleph.index.notifications import notifications_index, configure_notifications
from aleph.index.xref import xref_index, configure_xref

log = logging.getLogger(__name__)


def upgrade_search():
    """Add any missing properties to the index mappings."""
    configure_collections()
    configure_notifications()
    configure_entities()
    configure_xref()


def all_indexes():
    return ",".join(
        (
            collections_index(),
            notifications_index(),
            xref_index(),
            entities_read_index(),
        )
    )


def delete_index():
    es.indices.delete(index=all_indexes(), ignore=[404, 400])


def clear_index():
    es.delete_by_query(
        index=all_indexes(),
        body={"query": {"match_all": {}}},
        refresh=True,
        wait_for_completion=True,
        conflicts="proceed",
        ignore=[404],
    )
