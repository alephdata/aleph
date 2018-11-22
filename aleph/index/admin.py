import logging
from pprint import pprint, pformat  # noqa

from aleph.core import es
from aleph.index.core import all_indexes
from aleph.index.mapping import configure_collections
from aleph.index.mapping import configure_records
from aleph.index.mapping import configure_entities

log = logging.getLogger(__name__)


def upgrade_search():
    """Add any missing properties to the index mappings."""
    configure_collections()
    configure_records()
    configure_entities()


def delete_index():
    es.indices.delete(index=all_indexes(), ignore=[404, 400])


def refresh_index():
    es.indices.refresh(index=all_indexes(), ignore=[404, 400])


def clear_index():
    q = {'query': {'match_all': {}}}
    refresh_index()
    es.delete_by_query(index=all_indexes(),
                       body=q,
                       refresh=True,
                       wait_for_completion=True,
                       conflicts='proceed',
                       ignore=[404])
