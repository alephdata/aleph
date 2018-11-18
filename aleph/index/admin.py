import logging
from copy import deepcopy
from pprint import pprint, pformat  # noqa
from followthemoney import model
from followthemoney.types import registry

from aleph.core import es
from aleph.index.core import record_index, entity_index
from aleph.index.core import collections_index, all_indexes
from aleph.index.mapping import RECORD_MAPPING
from aleph.index.mapping import ENTITY_MAPPING
from aleph.index.mapping import COLLECTION_MAPPING
from aleph.index.mapping import INDEX_SETTINGS, PARTIAL_DATE

log = logging.getLogger(__name__)


def upgrade_search():
    """Add any missing properties to the index mappings."""
    compile_entity_mapping()
    INDEXES = [
        (collections_index(), COLLECTION_MAPPING),
        (entity_index(), ENTITY_MAPPING),
        (record_index(), RECORD_MAPPING),
    ]
    for (index, mapping) in INDEXES:
        log.info("Creating index: %s", index)
        settings = deepcopy(INDEX_SETTINGS)
        if index == record_index():
            # optimise records for bulk write
            settings['index']['refresh_interval'] = '15s'
        body = {
            'settings': settings,
            'mappings': {'doc': mapping}
        }
        res = es.indices.create(index, body=body, ignore=[404, 400])
        if res.get('status') == 400:
            # es.indices.put_mapping(index=index, doc_type='doc', body=mapping)
            es.indices.open(index=index, ignore=[400, 404])
            es.indices.clear_cache(index=index, ignore=[400, 404])


def compile_entity_mapping():
    TYPES = {
        registry.text: {"type": "text", "analyzer": "icu_latin"},
        registry.date: {"type": "date", "format": PARTIAL_DATE},
    }
    mapping = {}
    for prop in model.properties:
        config = TYPES.get(prop.type)
        if config is None:
            continue
        if mapping.get(prop.name, config) != config:
            raise RuntimeError("Ambiguous type for FtM property: %s" % prop)
        mapping[prop.name] = config
    ENTITY_MAPPING['properties']['properties']['properties'] = mapping
    log.info("%s", pformat(ENTITY_MAPPING))


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
                       conflicts='proceed')
