from __future__ import absolute_import

import logging
from hashlib import sha1
from elasticsearch.helpers import bulk, scan

from aleph.core import es, es_index
from aleph.index.mapping import TYPE_LEAD

log = logging.getLogger(__name__)


def delete_entity_leads(entity_id):
    """Delete all related leads from the index."""
    q = {
        'query': {
            'bool': {
                'should': [
                    {'term': {'entity_id': entity_id}},
                    {'term': {'match_id': entity_id}}
                ]
            }
        },
        '_source': False
    }

    def deletes():
        docs = scan(es, query=q, index=es_index, doc_type=TYPE_LEAD)
        for i, res in enumerate(docs):
            yield {
                '_op_type': 'delete',
                '_index': str(es_index),
                '_type': res.get('_type'),
                '_id': res.get('_id')
            }

    es.indices.refresh(index=es_index)
    bulk(es, deletes(), stats_only=True, request_timeout=200.0)


def index_lead(lead):
    """Index a lead."""
    hash_sum = sha1()
    hash_sum.update(lead.get('entity_id') or '')
    hash_sum.update(lead.get('match_id') or '')
    lead_id = hash_sum.hexdigest()
    es.index(index=es_index, doc_type=TYPE_LEAD, id=lead_id, body=lead)
