# Lead generator
import logging
from Levenshtein import jaro_winkler

from aleph.authz import Authz
from aleph.index import delete_entity_leads, index_lead
from aleph.search import QueryState
from aleph.search.entities import load_entity, similar_entities

log = logging.getLogger(__name__)


def entity_distance(entity, other):
    # once we have enough training data, this should use a regression model
    # of some sort to calculate a multi-attribute based similarity metric.
    # cf. https://github.com/datamade/rlr
    # http://scikit-learn.org/stable/auto_examples/linear_model/plot_ols.html
    return jaro_winkler(entity.get('name', ''), other.get('name', ''))


def generate_leads(entity_id):
    """Compute likely duplicates of a given entity and index these leads."""
    # Get rid of everything, also for deleted entities etc.
    delete_entity_leads(entity_id)

    entity = load_entity(entity_id)
    if entity is None:
        log.warning("[%r] not indexed, skip lead generation.", entity_id)
        return
    if not entity.get('collection_id'):
        log.warning("[%r] is not in a collecton, skip lead generation.", entity_id)  # noqa
        return

    log.debug("Generating leads for [%(id)s]: %(name)s", entity)
    authz = Authz(override=True)
    state = QueryState({}, authz, limit=100)
    result = similar_entities(entity, state)
    for other in result.get('results', []):
        score = entity_distance(entity, other)
        log.debug(" -[%.2f]-> %s", score, other.get('name'))
        # TODO: implement some cut-off
        index_lead({
            'entity_id': entity.get('id'),
            'entity_collection_id': entity.get('collection_id'),
            'score': score,
            'match_id': other.get('id'),
            'schema': other.get('schema'),
            'schemata': other.get('schemata'),
            'collection_id': other.get('collection_id'),
            'dataset': other.get('dataset'),
            'roles': other.get('roles')
        })
