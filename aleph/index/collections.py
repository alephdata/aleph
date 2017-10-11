from pprint import pprint  # noqa

from aleph.core import es, es_index
from aleph.index.stats import get_collection_stats
from aleph.index.mapping import TYPE_LINK, TYPE_DOCUMENT, TYPE_ENTITY
from aleph.index.mapping import TYPE_COLLECTION
from aleph.index.util import query_delete

CHILD_TYPES = [TYPE_LINK, TYPE_DOCUMENT, TYPE_ENTITY]


def index_collection(collection):
    """Index a collection."""
    if collection.deleted_at is not None:
        return delete_collection(collection.id)

    data = {
        'foreign_id': collection.foreign_id,
        'created_at': collection.created_at,
        'updated_at': collection.updated_at,
        'label': collection.label,
        'summary': collection.summary,
        'category': collection.category,
        'countries': collection.countries,
        'languages': collection.languages,
        'managed': collection.managed,
        'roles': collection.roles
    }
    if collection.creator is not None:
        data['creator'] = {
            'id': collection.creator.id,
            'type': collection.creator.type,
            'name': collection.creator.name
        }
    data.update(get_collection_stats(collection.id))
    es.index(index=es_index,
             doc_type=TYPE_COLLECTION,
             id=collection.id,
             body=data)


def update_roles(collection):
    """Update the role visibility of objects which are part of collections."""
    roles = ', '.join([str(r) for r in collection.roles])
    body = {
        'query': {'term': {'collection_id': collection.id}},
        'script': {
            'inline': 'ctx._source.roles = [%s]' % roles
        }
    }
    es.update_by_query(index=es_index,
                       doc_type=CHILD_TYPES,
                       body=body,
                       wait_for_completion=False)


def delete_collection(collection_id):
    """Delete all documents from a particular collection."""
    query_delete({'term': {'collection_id': collection_id}},
                 wait=False)
    query_delete({'term': {'entity_collection_id': collection_id}},
                 wait=False)
    es.delete(index=es_index,
              doc_type=TYPE_COLLECTION,
              id=collection_id,
              ignore=[404])
