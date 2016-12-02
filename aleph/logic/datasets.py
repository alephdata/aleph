import time
import logging
from elasticsearch import ElasticsearchException

from aleph.core import celery, datasets
from aleph.schema import Schema
from aleph.index import index_items

log = logging.getLogger(__name__)
QUEUE_PAGE = 1000


def map_row(query, row):
    """Use the mapper to generate entities and links from a source row."""
    entities = {}
    for entity in query.entities:
        data = entity.to_index(row)
        if data is not None:
            entities[entity.name] = data
            yield (Schema.ENTITY, data['id'], data)

    for link in query.links:
        for inverted in [True, False]:
            data = link.to_index(row, entities, inverted=inverted)
            if data is not None:
                yield (Schema.LINK, data['id'], data)


@celery.task(bind=True)
def load_rows(task, dataset_name, query_idx, rows):
    """Load a single batch of QUEUE_PAGE rows from the given query."""
    dataset = datasets.get(dataset_name)
    items = []
    for row in rows:
        for item in map_row(dataset.queries[query_idx], row):
            items.append(item)

    try:
        index_items(items)
    except ElasticsearchException as exc:
        time.sleep(30)
        raise task.retry(exc=exc, countdown=30, max_retries=5)

    log.info("[%r] Indexed %s rows as %s documents...",
             dataset_name, len(rows), len(items))


def load_dataset(dataset):
    """Index all the entities and links in a given dataset."""
    for query_idx, query in enumerate(dataset.queries):
        rows = []
        for row_idx, row in enumerate(query.iterrows()):
            rows.append(row)
            if len(rows) >= QUEUE_PAGE:
                load_rows.delay(dataset.name, query_idx, rows)
                rows = []
            if row_idx != 0 and row_idx % 10000 == 0:
                log.info("Tasked %s rows...", row_idx)
        if len(rows):
            load_rows.delay(dataset.name, query_idx, rows)
