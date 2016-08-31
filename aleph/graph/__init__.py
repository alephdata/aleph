# coding: utf-8
import logging
from contextlib import contextmanager

from aleph.core import get_graph, get_config
from aleph.graph.schema import NodeType
from aleph.graph.entities import load_entities, load_entity, remove_entity  # noqa
from aleph.graph.collections import load_collection, remove_collection  # noqa
from aleph.graph.documents import load_documents, load_document, remove_document  # noqa
from aleph.graph.paths import generate_paths, delete_paths  # noqa
from aleph.graph.mapping import Mapping  # noqa
from aleph.graph.util import BASE_NODE

log = logging.getLogger(__name__)


def upgrade_graph():
    graph = get_graph()
    if graph is None:
        return
    # graph.delete_all()
    cur = graph.run("MATCH (n) WHERE NOT (n)--() DELETE n;")
    log.debug("Deleted %(nodes_deleted)s orphan nodes.", cur.stats())

    # Common base type indexes
    if 'fingerprint' not in graph.schema.get_indexes(BASE_NODE):
        graph.schema.create_index(BASE_NODE, 'fingerprint')
    if 'id' not in graph.schema.get_uniqueness_constraints(BASE_NODE):
        graph.schema.create_uniqueness_constraint(BASE_NODE, 'id')

    for node_type in NodeType.all():
        node_type.ensure_indices(graph)


def graph_metadata():
    graph = get_graph()
    if graph is None:
        return {'active': False}
    ignore_labels = ['Collection', BASE_NODE]
    labels = [l for l in graph.node_labels if l not in ignore_labels]
    types = [t for t in graph.relationship_types if t != 'PART_OF']
    return {
        'active': True,
        'labels': labels,
        'types': types,
        'icons': get_config('GRAPH_ICONS'),
        'colors': get_config('GRAPH_COLORS')
    }


@contextmanager
def transaction():
    graph = get_graph()
    if graph is None:
        yield None
    else:
        # this produces deadlocks en masse:
        # tx = graph.begin()
        # yield tx
        # tx.commit()
        yield graph
