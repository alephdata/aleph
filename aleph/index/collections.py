import six
from elasticsearch.helpers import scan

from aleph.core import es, es_index
from aleph.index.admin import flush_index
from aleph.index.util import bulk_op


def delete_collection(collection_id):
    """Delete all documents from a particular collection."""
    q = {'query': {'term': {'collection_id': collection_id}}, '_source': False}

    def deletes():
        for res in scan(es, query=q, index=es_index):
            yield {
                '_op_type': 'delete',
                '_index': six.text_type(es_index),
                '_type': res.get('_type'),
                '_id': res.get('_id')
            }

    flush_index()
    bulk_op(deletes())
    flush_index()
