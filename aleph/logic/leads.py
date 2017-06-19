# Lead generator
import logging

from aleph.authz import Authz
from aleph.core import db
from aleph.index import delete_entity_leads, index_lead
from aleph.index.entities import get_entity
from aleph.model import EntityIdentity
from aleph.search import SimilarEntitiesQuery, SearchQueryParser
from aleph.logic.xref.distance import entity_distance

log = logging.getLogger(__name__)


def generate_leads(entity_id):
    """Compute likely duplicates of a given entity and index these leads."""
    # Get rid of everything, also for deleted entities etc.
    delete_entity_leads(entity_id)
    entity = get_entity(entity_id)

    if entity is None:
        return

    log.debug("Generating leads for [%(id)s]: %(name)s", entity)
    authz = Authz(override=True)
    judgements = EntityIdentity.judgements_by_entity(entity_id)
    parser = SearchQueryParser({}, authz, limit=100)
    query = SimilarEntitiesQuery(parser, entity=entity)
    results = query.search().get('hits', {})
    for doc in results.get('hits', []):
        other = doc.get('_source')
        score = entity_distance(entity, other)
        log.debug(" -[%.2f]-> %s", score, other.get('name'))
        # TODO: implement some cut-off
        index_lead({
            'entity_id': entity_id,
            'entity_collection_id': entity.get('collection_id'),
            'score': score,
            'judgement': judgements.get(doc.get('_id'), 0),
            'match_id': doc.get('_id'),
            'schema': other.get('schema'),
            'schemata': other.get('schemata'),
            'collection_id': other.get('collection_id'),
            'roles': other.get('roles')
        })


def update_lead(entity, match, judgement, judge=None):
    EntityIdentity.save(entity.get('id'), match.get('id'),
                        judgement, judge=judge)
    db.session.commit()
    score = entity_distance(entity, match)
    index_lead({
        'entity_id': entity.get('id'),
        'entity_collection_id': entity.get('collection_id'),
        'score': score,
        'judgement': judgement,
        'match_id': match.get('id'),
        'schema': match.get('schema'),
        'schemata': match.get('schemata'),
        'collection_id': match.get('collection_id'),
        'dataset': match.get('dataset'),
        'roles': match.get('roles')
    })
