# coding: utf-8
import logging
from contextlib import contextmanager

from aleph.core import get_graph, get_config
from aleph.graph.schema import NodeType
from aleph.graph.entities import load_entities, load_entity, remove_entity  # noqa
from aleph.graph.collections import load_collection, remove_collection  # noqa
from aleph.graph.documents import load_documents, load_document, remove_document  # noqa
from aleph.graph.mapping import Mapping  # noqa

log = logging.getLogger(__name__)


def upgrade_graph():
    graph = get_graph()
    if graph is None:
        return
    # graph.delete_all()
    cur = graph.run("MATCH (n) WHERE NOT (n)--() DELETE n;")
    log.debug("Deleted %(nodes_deleted)s orphan nodes.", cur.stats())

    for node_type in NodeType.all():
        node_type.ensure_indices(graph)


def graph_metadata():
    graph = get_graph()
    if graph is None:
        return {'active': False}
    labels = [l for l in graph.node_labels if l != 'Collection']
    return {
        'active': True,
        'labels': labels,
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
