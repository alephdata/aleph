import time
import logging
from pprint import pprint  # noqa
from followthemoney.types import registry

from aleph.logic.graph.expand import expand_node

log = logging.getLogger(__name__)


class Node(object):

    def __init__(self, graph, type_, value, seed=None):
        self.graph = graph
        self.ref = type_.ref(value)
        self.type = type_
        self.value = value
        self.seed = seed
        self.weight = seed or 0
        self.decay = type_.specificity(value)
        self.origins = set()

    def compute_weight(self):
        weight = 0 if self.seed is None else self.seed
        if self.type.prefix is None:
            return weight
        if self.decay == 0:
            return weight
        for node in self.origins:
            weight += node.weight
        return weight * self.decay * 0.9

    def __hash__(self):
        return hash(self.ref)

    def __eq__(self, other):
        return other.ref == self.ref

    def __repr__(self):
        return '<Node(%s, %r)>' % (self.type.name, self.value)


class Path(object):

    def __init__(self, graph, origin, target):
        self.graph = graph
        self.origin = origin
        self.target = target

    def __hash__(self):
        return hash((self.origin, self.target))

    def __eq__(self, other):
        return hash(self) == hash(other)

    def __repr__(self):
        return '<Path(%r, %r)>' % (self.origin, self.target)


class Graph(object):

    def __init__(self):
        self.nodes = {}
        self.paths = set()
        self.seen = set()
        self.links = []

    def add_node(self, type_, value, seed=None):
        node = self.nodes.get((type_, value))
        if node is None:
            node = Node(self, type_, value, seed=seed)
            self.nodes[(type_, value)] = node
        return node

    def seed(self, type_, value):
        self.add_node(type_, value, seed=1)

    def next_node(self):
        nodes = []
        for node in self.nodes.values():
            if node.type.prefix is None:
                continue
            if node.weight == 0:
                continue
            if node in self.seen:
                continue
            nodes.append(node)
        if not len(nodes):
            return
        return max(nodes, key=lambda n: n.weight)

    def expand_node(self, node):
        self.seen.add(node)
        log.debug("Expand: %r (%s)", node, node.weight)
        for link in expand_node(node.type, node.value):
            self.links.append(link)
            type_ = registry.entity if link.inverted else link.prop.type
            target = self.add_node(type_, link.value)
            target.origins.add(node)
            self.paths.add(Path(self, node, target))
            if target.weight == 0:
                target.weight = target.compute_weight()

    def build(self, steps):
        for i in range(steps):
            node = self.next_node()
            if node is None:
                break
            self.expand_node(node)


def traverse_entity(entity, steam=2):
    start = time.time()
    graph = Graph()
    graph.seed(registry.entity, entity)
    graph.build(steps=steam)
    end = time.time()
    duration = end - start
    log.info("Traversal time: %s" % duration)
    return graph.links
