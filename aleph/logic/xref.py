import logging
from pprint import pprint  # noqa
from followthemoney import model
from followthemoney.types import registry
from followthemoney.compare import compare
from followthemoney.export.excel import ExcelWriter

from aleph.core import db, es
from aleph.model import Match, Collection
from aleph.logic import resolver
from aleph.queues import queue_task, OP_XREF_ITEM
from aleph.index.entities import iter_entities, entities_by_ids
from aleph.index.indexes import entities_read_index
from aleph.index.util import unpack_result, none_query
from aleph.index.util import BULK_PAGE
from aleph.logic.matching import match_query
from aleph.logic.util import entity_url

log = logging.getLogger(__name__)
SCORE_CUTOFF = 0.05


def xref_query_item(proxy, collection_ids=None):
    """Cross-reference an entity or document, given as an indexed document."""
    query = match_query(proxy, collection_ids=collection_ids)
    if query == none_query():
        return

    query = {
        'query': query,
        'size': 100,
        '_source': {'includes': ['schema', 'properties', 'collection_id']}
    }
    matchable = list(proxy.schema.matchable_schemata)
    index = entities_read_index(schema=matchable)
    result = es.search(index=index, body=query)
    results = result.get('hits').get('hits')
    for result in results:
        result = unpack_result(result)
        if result is not None:
            other = model.get_proxy(result)
            score = compare(model, proxy, other)
            if score >= SCORE_CUTOFF:
                yield score, result.get('collection_id'), other


def xref_item(stage, collection, entity_id=None, against_collection_ids=None):
    "Cross-reference an entity against others to generate potential matches."
    entity_ids = [entity_id]
    # This is running as a background job. In order to avoid running each
    # entity one by one, we do it 101 at a time. This avoids sending redudant
    # queries to the database and elasticsearch, making cross-ref much faster.
    for task in stage.get_tasks(limit=50):
        entity_ids.append(task.payload.get('entity_id'))
    stage.mark_done(len(entity_ids) - 1)
    # log.debug("Have %d entity IDs for xref", len(entity_ids))
    for data in entities_by_ids(entity_ids, includes=['schema', 'properties']):
        proxy = model.get_proxy(data)
        # log.info("XRef: %r", proxy)
        dq = db.session.query(Match)
        dq = dq.filter(Match.entity_id == proxy.id)
        dq.delete()
        matches = xref_query_item(proxy, collection_ids=against_collection_ids)
        for (score, other_id, other) in matches:
            log.info("Xref [%.3f]: %s <=> %s", score, proxy, other)
            obj = Match()
            obj.entity_id = proxy.id
            obj.collection_id = collection.id
            obj.match_id = other.id
            obj.match_collection_id = other_id
            obj.score = score
            db.session.add(obj)
    db.session.commit()


def xref_collection(stage, collection, against_collection_ids=None):
    """Cross-reference all the entities and documents in a collection."""
    matchable = [s.name for s in model if s.matchable]
    entities = iter_entities(collection_id=collection.id, schemata=matchable)
    for entity in entities:
        payload = {
            'entity_id': entity.get('id'),
            'against_collection_ids': against_collection_ids
        }
        queue_task(collection, OP_XREF_ITEM,
                   job_id=stage.job.id,
                   payload=payload)


def _format_date(proxy):
    dates = proxy.get_type_values(registry.date)
    if not len(dates):
        return ''
    return min(dates)


def _format_country(proxy):
    countries = [c.upper() for c in proxy.countries]
    return ', '.join(countries)


def _iter_match_batch(stub, sheet, batch):
    matchable = [s.name for s in model if s.matchable]
    entities = set()
    for match in batch:
        entities.add(match.entity_id)
        entities.add(match.match_id)
        resolver.queue(stub, Collection, match.match_collection_id)

    resolver.resolve(stub)
    entities = entities_by_ids(list(entities), schemata=matchable)
    entities = {e.get('id'): e for e in entities}

    for obj in batch:
        entity = entities.get(str(obj.entity_id))
        match = entities.get(str(obj.match_id))
        collection = resolver.get(stub, Collection, obj.match_collection_id)
        if entity is None or match is None or collection is None:
            continue
        eproxy = model.get_proxy(entity)
        mproxy = model.get_proxy(match)
        sheet.append([
            obj.score,
            eproxy.caption,
            _format_date(eproxy),
            _format_country(eproxy),
            collection.get('label'),
            mproxy.caption,
            _format_date(mproxy),
            _format_country(mproxy),
            entity_url(eproxy.id),
            entity_url(mproxy.id),
        ])


def export_matches(collection_id, authz):
    """Export the top N matches of cross-referencing for the given collection
    to an Excel formatted export."""
    collections = authz.collections(authz.READ)
    dq = db.session.query(Match)
    dq = dq.filter(Match.collection_id == collection_id)
    dq = dq.filter(Match.match_collection_id.in_(collections))
    dq = dq.order_by(Match.score.desc())
    excel = ExcelWriter()
    headers = [
        'Score',
        'Entity Name',
        'Entity Date',
        'Entity Countries',
        'Candidate Collection',
        'Candidate Name',
        'Candidate Date',
        'Candidate Countries',
        'Entity Link',
        'Candidate Link',
    ]
    sheet = excel.make_sheet('Cross-reference', headers)
    batch = []
    for match in dq.yield_per(BULK_PAGE * 10):
        batch.append(match)
        if len(batch) >= BULK_PAGE:
            _iter_match_batch(excel, sheet, batch)
            batch = []
    if len(batch):
        _iter_match_batch(excel, sheet, batch)
    return excel.get_bytesio()
