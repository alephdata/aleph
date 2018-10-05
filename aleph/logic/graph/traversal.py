import time
import logging
from pprint import pprint  # noqa
from followthemoney.types import registry

from aleph.logic.graph.expand import expand_node

log = logging.getLogger(__name__)


class Node(object):

    def __init__(self, graph, type_, value, seed=None):
        self.graph = graph
        self.id = (type_, value)
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
        return hash(self.id)

    def __eq__(self, other):
        return other.id == self.id

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
        print("Expand: %r (%s)" % (node, node.weight))
        # node_ref = node.type.ref(node.value)
        for link in expand_node(node.type, node.value):
            self.links.append(link)
            target = self.add_node(link.prop.type, link.value)
            target.origins.add(node)
            self.paths.add(Path(self, node, target))
            target.weight = target.compute_weight()
        # print("Stats: %s nodes, %s paths" % (len(self.nodes), len(self.paths)))

    def build(self, steps):
        for i in range(steps):
            node = self.next_node()
            if node is None:
                break
            self.expand_node(node)


# def traverse(type_, value, steam=2, path=None):
#     if path is None:
#         path = set()
#     if (type_, value) in path:
#         return
#     path.add((type_, value))
#     log.info("Traverse: %s (%s), %s", value, type_, steam)
#     ref = type_.ref(value)
#     for link in expand_node(type_, value):
#         if link.ref != ref:
#             link = link.invert()
#         yield (steam, link)
#         specificity = link.prop.type.specificity(link.value)
#         if specificity == 0:
#             continue
#         next_steam = steam * specificity * link.weight
#         log.info("Link: %s -> %s", link, next_steam)
#         if next_steam > 0:
#             yield from traverse(link.prop.type, link.value,
#                                 steam=next_steam,
#                                 path=path)


def traverse_entity(entity, steam=2):
    start = time.time()
    graph = Graph()
    graph.seed(registry.entity, entity)
    graph.build(steps=steam)
    end = time.time()
    duration = end - start
    print("Duration: %s" % duration)
    return graph.links
