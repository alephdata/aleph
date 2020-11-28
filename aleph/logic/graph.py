import logging
from pprint import pprint  # noqa
from followthemoney import model
from followthemoney.types import registry
from followthemoney.graph import Graph as FtMGraph

from aleph.core import es
from aleph.model import Entity
from aleph.index.entities import ENTITY_SOURCE
from aleph.index.indexes import entities_read_index
from aleph.index.util import field_filter_query, authz_query, unpack_result

log = logging.getLogger(__name__)


class Graph(FtMGraph):
    """A subclass of `followthemoney.graph:Graph` that can resolve
    entities against the aleph search index and entity cache."""

    def resolve(self):
        from aleph.logic import resolver

        for id_ in self.queued:
            node_id = registry.entity.node_id_safe(id_)
            node = self.nodes.get(node_id)
            schema = None if node is None else node.schema
            resolver.queue(self, Entity, id_, schema=schema)
        resolver.resolve(self)
        for id_ in self.queued:
            entity = resolver.get(self, Entity, id_)
            if entity is not None:
                self.add(model.get_proxy(entity))
