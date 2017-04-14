import logging

from aleph.index import index_items

log = logging.getLogger(__name__)
PAGE = 1000


def load_rows(dataset, query, rows):
    """Load a single batch of QUEUE_PAGE rows from the given query."""
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

    index_items(entities, links)
    log.info("[%s] Indexed %s rows as %s entities, %s links...",
             dataset.name, len(rows), len(entities), len(links))


def load_dataset(dataset):
    """Index all the entities and links in a given dataset."""
    for query in dataset.queries:
        rows = []
        for row_idx, row in enumerate(query.iterrows(), 1):
            rows.append(row)
            if len(rows) >= PAGE:
                log.info("[%s] Tasked %s rows...", dataset.name, row_idx)
                load_rows(dataset, query, rows)
                rows = []
        if len(rows):
            load_rows(dataset, query, rows)
