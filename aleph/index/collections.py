from aleph.index.util import query_delete


def delete_collection(collection_id):
    """Delete all documents from a particular collection."""
    q = {'query': {'term': {'collection_id': collection_id}}, '_source': False}
    query_delete(q)
