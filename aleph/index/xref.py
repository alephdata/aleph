import logging
from pprint import pprint  # noqa
from datetime import datetime
from servicelayer.cache import make_key
from followthemoney.types import registry

from aleph.core import settings
from aleph.index.util import index_name, index_settings, configure_index
from aleph.index.util import query_delete, bulk_actions
from aleph.index.util import KEYWORD

log = logging.getLogger(__name__)


def xref_index():
    return index_name('xref', settings.INDEX_WRITE)


def configure_xref():
    mapping = {
        "date_detection": False,
        "dynamic": False,
        "properties": {
            "score": {"type": "float"},
            "entity_id": KEYWORD,
            "collection_id": KEYWORD,
            "match_id": KEYWORD,
            "match_collection_id": KEYWORD,
            registry.country.group: KEYWORD,
            "created_at": {"type": "date"},
        }
    }
    index = xref_index()
    settings = index_settings(shards=5)
    return configure_index(index, mapping, settings)


def index_matches(collection, entity, matches, sync=False):
    """Index cross-referencing matches."""
    actions = []
    for (score, match_collection_id, match) in matches:
        actions.append({
            '_id': make_key(entity.id, collection.id, match.id),
            '_index': xref_index(),
            '_source': {
                'score': score,
                'entity_id': entity.id,
                'collection_id': collection.id,
                'match_id': match.id,
                'match_collection_id': match_collection_id,
                'created_at': datetime.utcnow(),
            }
        })
    if len(actions):
        bulk_actions(actions, sync=sync)


def delete_xref(collection, sync=False):
    """Delete xref matches of an entity or a collection."""
    shoulds = [
        {'term': {'collection_id': collection.id}},
        {'term': {'match_collection_id': collection.id}},
    ]
    query = {
        'bool': {
            'should': shoulds,
            'minimum_should_match': 1
        }
    }
    query_delete(xref_index(), query, sync=sync)
