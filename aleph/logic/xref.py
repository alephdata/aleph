import logging
from pprint import pprint  # noqa
from followthemoney import model
from followthemoney.types import registry
from followthemoney.compare import compare
from followthemoney.export.excel import ExcelWriter

from aleph.core import es
from aleph.model import Collection
from aleph.logic import resolver
from aleph.queues import queue_task, OP_XREF_ITEM
from aleph.index import xref as index
from aleph.index.entities import iter_entities, entities_by_ids
from aleph.index.indexes import entities_read_index
from aleph.index.util import unpack_result, none_query
from aleph.index.util import BULK_PAGE
from aleph.logic.matching import match_query
from aleph.logic.util import entity_url

log = logging.getLogger(__name__)
SCORE_CUTOFF = 0.3
INCLUDES = ['schema', 'properties', 'collection_id']


def _query_item(collection, entity):
    """Cross-reference an entity or document, given as an indexed document."""
    query = match_query(entity, source_collection_id=collection.id)
    if query == none_query():
        return

    query = {
        'query': query,
        'size': 100,
        '_source': {'includes': INCLUDES}
    }
    matchable = list(entity.schema.matchable_schemata)
    index = entities_read_index(schema=matchable)
    result = es.search(index=index, body=query)
    for result in result.get('hits').get('hits'):
        result = unpack_result(result)
        if result is None:
            continue
        match = model.get_proxy(result)
        score = compare(model, entity, match)
        if score >= SCORE_CUTOFF:
            # log.debug('Match: %r <-[%.3f]-> %r',
            #           entity.caption, score, match.caption)
            yield score, entity, result.get('collection_id'), match


def _query_matches(collection, entity_ids):
    """Generate matches for indexing."""
    for data in entities_by_ids(entity_ids, includes=INCLUDES):
        entity = model.get_proxy(data)
        yield from _query_item(collection, entity)


def xref_item(stage, collection, entity_id=None, batch=50):
    "Cross-reference an entity against others to generate potential matches."
    entity_ids = [entity_id]
    # This is running as a background job. In order to avoid running each
    # entity one by one, we do it 101 at a time. This avoids sending redudant
    # queries to the database and elasticsearch, making cross-ref much faster.
    for task in stage.get_tasks(limit=batch):
        entity_ids.append(task.payload.get('entity_id'))
    matches = _query_matches(collection, entity_ids)
    index.index_matches(collection, matches, sync=False)
    stage.mark_done(len(entity_ids) - 1)


def xref_collection(stage, collection):
    """Cross-reference all the entities and documents in a collection."""
    index.delete_xref(collection)
    matchable = [s.name for s in model if s.matchable]
    entities = iter_entities(collection_id=collection.id, schemata=matchable)
    for entity in entities:
        queue_task(collection, OP_XREF_ITEM, job_id=stage.job.id,
                   payload={'entity_id': entity.get('id')})


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
        entities.add(match.get('entity_id'))
        entities.add(match.get('match_id'))
        resolver.queue(stub, Collection, match.get('match_collection_id'))

    resolver.resolve(stub)
    entities = entities_by_ids(list(entities), schemata=matchable)
    entities = {e.get('id'): e for e in entities}

    for obj in batch:
        entity = entities.get(str(obj.get('entity_id')))
        match = entities.get(str(obj.get('match_id')))
        collection_id = obj.get('match_collection_id')
        collection = resolver.get(stub, Collection, collection_id)
        if entity is None or match is None or collection is None:
            continue
        eproxy = model.get_proxy(entity)
        mproxy = model.get_proxy(match)
        sheet.append([
            obj.get('score'),
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


def export_matches(collection, authz):
    """Export the top N matches of cross-referencing for the given collection
    to an Excel formatted export."""
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
    for match in index.iter_matches(collection, authz):
        batch.append(match)
        if len(batch) >= BULK_PAGE:
            _iter_match_batch(excel, sheet, batch)
            batch = []
    if len(batch):
        _iter_match_batch(excel, sheet, batch)
    return excel.get_bytesio()
