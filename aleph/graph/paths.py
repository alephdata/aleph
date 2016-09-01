import logging

from aleph.core import db
from aleph.model import Path
from aleph.util import unwind
from aleph.graph.nodes import NodeType
from aleph.graph.util import BASE_NODE

log = logging.getLogger(__name__)

# Paths are cached because they take a long time to generate and thus browsing
# them via the UI would take minutes for each page load or filter to be
# applied. This is obviously not ideal, since it means the data is going PSQL
# -> Neo4J -> PSQL. That round trip is almost guaranteed to cause weird
# artifacts when upstream items are deleted or the graph has to be
# re-generated.
SKIP_TYPES = ['PART_OF', 'MENTIONS']


def generate_paths(graph, entity, ignore_types=SKIP_TYPES):
    """Generate all possible paths which end in a different collection."""
    Path.delete_by_entity(entity.id)
    if graph is None or entity.state != entity.STATE_ACTIVE:
        return
    log.info("Generating graph path cache: %r", entity)
    # TODO: should max path length be configurable?
    q = "MATCH pth = (start:Aleph:Entity)-[*1..2]-(end:Aleph:Entity) " \
        "MATCH (start)-[startpart:PART_OF]->(startcoll:Collection) " \
        "MATCH (end)-[endpart:PART_OF]->(endcoll:Collection) " \
        "WHERE start.fingerprint = {entity_fp} AND " \
        "startpart.alephCanonical = {entity_id} AND " \
        "startcoll.alephCollection <> endcoll.alephCollection AND " \
        "all(r IN relationships(pth) WHERE NOT type(r) IN {ignore_types}) " \
        "WITH DISTINCT start, end, " \
        " COLLECT(DISTINCT extract(x IN nodes(pth) | x.id)) AS paths, " \
        " COLLECT(DISTINCT extract(x IN nodes(pth) | labels(x))) AS labels, " \
        " COLLECT(DISTINCT extract(r IN relationships(pth) | type(r))) AS types, " \
        " COLLECT(DISTINCT endcoll.alephCollection) AS end_collection_id " \
        "RETURN start, end, paths, types, labels, end_collection_id "
    count = 0
    for row in graph.run(q, entity_id=entity.id,
                         entity_fp=entity.fingerprint,
                         ignore_types=ignore_types):
        labels = unwind(row.get('labels'))
        labels = [l for l in labels if l != BASE_NODE]
        types = unwind(row.get('types'))
        if len(types) == 1 and 'AKA' in types:
            continue
        Path.from_data(entity, row.get('end_collection_id'),
                       row.get('paths'), types, labels,
                       NodeType.dict(row.get('start')),
                       NodeType.dict(row.get('end')))
        count += 1
    db.session.commit()
    # TODO: send email to collection owners?
    log.info("Generated %s paths for %r", count, entity)


def delete_paths(entity_id):
    """Delete the paths based on this entity."""
    Path.delete_by_entity(entity_id)
    db.session.commit()
