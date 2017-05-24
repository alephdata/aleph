from aleph.index.util import query_delete


def delete_collection(collection_id):
    """Delete all documents from a particular collection."""
    query_delete({'term': {'collection_id': collection_id}})
    query_delete({'term': {'entity_collection_id': collection_id}})
