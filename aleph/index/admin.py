import logging
from pprint import pprint, pformat  # noqa
from elasticsearch.exceptions import RequestError

from aleph.core import es
from aleph.index.indexes import all_indexes
from aleph.index.indexes import configure_collections
from aleph.index.indexes import configure_records
from aleph.index.indexes import configure_entities

log = logging.getLogger(__name__)


def upgrade_search():
    """Add any missing properties to the index mappings."""
    configure_collections()
    configure_records()
    configure_entities()


def delete_index():
    es.indices.delete(index=all_indexes(),
                      ignore=[404, 400])


def ensure_index():
    try:
        upgrade_search()
    except RequestError:
        delete_index()
        upgrade_search()


def refresh_index():
    es.indices.refresh(index=all_indexes(),
                       ignore=[404, 400])


def clear_index():
    es.delete_by_query(index=all_indexes(),
                       doc_type='doc',
                       body={'query': {'match_all': {}}},
                       refresh=True,
                       wait_for_completion=True,
                       conflicts='proceed',
                       ignore=[404])
