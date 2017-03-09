import time
import logging
from random import randrange
from elasticsearch import ElasticsearchException
from elasticsearch.helpers import BulkIndexError

from aleph.core import celery, datasets
from aleph.index import index_items

log = logging.getLogger(__name__)
QUEUE_PAGE = 1000


@celery.task()
def load_rows(dataset_name, query_idx, rows):
    """Load a single batch of QUEUE_PAGE rows from the given query."""
    dataset = datasets.get(dataset_name)
    query = list(dataset.queries)[query_idx]
    entities = {}
    links = []
    for row in rows:
        entity_map = {}
        for entity in query.entities:
            data = entity.to_index(row)
            if data is not None:
                entity_map[entity.name] = data
                entities[data['id']] = data

        for link in query.links:
            for inverted in [False, True]:
                data = link.to_index(row, entity_map, inverted=inverted)
                if data is not None:
                    links.append(data)

    while True:
        try:
            index_items(entities, links)
            break
        except (ElasticsearchException, BulkIndexError) as exc:
            delay = randrange(60, 180)
            log.info("%s - Sleep %ss...", exc, delay)
            time.sleep(delay)

    log.info("[%r] Indexed %s rows as %s entities, %s links...",
             dataset_name, len(rows), len(entities), len(links))


def load_dataset(dataset):
    """Index all the entities and links in a given dataset."""
    for query_idx, query in enumerate(dataset.queries):
        rows = []
        if query.db_connect:
            generator = query.iterrows()
        else:
            generator = query.itercsvrows()
        for row_idx, row in enumerate(generator):
            rows.append(row)
            if len(rows) >= QUEUE_PAGE:
                load_rows.delay(dataset.name, query_idx, rows)
                rows = []
            if row_idx != 0 and row_idx % 10000 == 0:
                log.info("Tasked %s rows...", row_idx)
        if len(rows):
            load_rows.delay(dataset.name, query_idx, rows)
