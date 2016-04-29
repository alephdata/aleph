import logging

from aleph.core import get_es, get_es_index
from aleph.util import latinize_text
from aleph.index.mapping import TYPE_ENTITY
from aleph.index.util import expand_json

log = logging.getLogger(__name__)


def delete_entity(entity_id):
    """Delete an entity from the index."""
    get_es().delete(index=get_es_index(), doc_type=TYPE_ENTITY, id=entity_id)


def index_entity(entity):
    """Index an entity."""
    data = entity.to_dict()
    data.pop('id', None)
    data['collection_id'] = entity.collection_id
    data['name_latin'] = latinize_text(data.get('name'))
    data['summary_latin'] = latinize_text(data.get('summary'))
    data['description_latin'] = latinize_text(data.get('description'))
    data = expand_json(data)
    get_es().index(index=get_es_index(), doc_type=TYPE_ENTITY,
                   id=entity.id, body=data)
