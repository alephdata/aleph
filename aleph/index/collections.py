from pprint import pprint  # noqa

from aleph.core import es
from aleph.index.stats import get_collection_stats
from aleph.index.core import collection_type
from aleph.index.core import collection_index, collections_index
from aleph.index.core import entities_index, entity_type, entity_index
from aleph.index.core import records_index
from aleph.index.util import query_delete


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
    es.index(index=collection_index(),
             doc_type=collection_type(),
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
    es.update_by_query(index=entity_index(),
                       doc_type=entity_type(),
                       body=body,
                       wait_for_completion=False)


def delete_collection(collection_id, wait=True):
    """Delete all documents from a particular collection."""
    query = {'term': {'collection_id': collection_id}}
    query_delete(records_index(), query, wait=wait)
    query_delete(entities_index(), query, wait=wait)
    es.delete(index=collections_index(),
              doc_type=collection_type(),
              id=collection_id,
              ignore=[404])
