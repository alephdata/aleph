from __future__ import absolute_import

import logging
from hashlib import sha1

from aleph.core import es, es_index
from aleph.index.mapping import TYPE_LEAD
from aleph.index.util import query_delete

log = logging.getLogger(__name__)


def delete_entity_leads(entity_id):
    """Delete all entity-related leads from the index."""
    q = {
        'bool': {
            'should': [
                {'term': {'entity_id': entity_id}},
                {'term': {'match_id': entity_id}}
            ]
        }
    }
    query_delete(q, doc_type=TYPE_LEAD)


def index_lead(lead):
    """Index a lead."""
    hash_sum = sha1()
    hash_sum.update(lead.get('entity_id') or '')
    hash_sum.update(lead.get('match_id') or '')
    lead_id = hash_sum.hexdigest()
    es.index(index=es_index, doc_type=TYPE_LEAD, id=lead_id, body=lead)
