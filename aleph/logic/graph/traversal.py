import logging
from pprint import pprint  # noqa

from aleph.logic.graph.expand import expand_node

log = logging.getLogger(__name__)


class Step(object):

    def __init__(self, graph, node, seed=None):
        self.graph = graph
        self.node = node
        self.id = node.id
        self.seed = seed
        self.weight = seed or 0
        self.decay = node.type.specificity(node.value)
        self.origins = set()

    def compute_weight(self):
        weight = 0 if self.seed is None else self.seed
        if self.node.type.group is None:
            return weight
        if self.decay == 0:
            return weight
        for step in self.origins:
            weight += step.weight
        return weight * self.decay * 0.9

    def __hash__(self):
        return hash(self.id)

    def __eq__(self, other):
        return other.id == self.id

    def __repr__(self):
        return '<Step(%r)>' % (self.id)


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
        self.steps = {}
        self.paths = set()
        self.seen = set()
        self.links = []

    def add_node(self, node, seed=None):
        step = self.steps.get(node.id)
        if step is None:
            step = Step(self, node, seed=seed)
            self.steps[step.id] = step
        return step

    def seed(self, node):
        self.add_node(node, seed=1)

    def next_step(self):
        steps = []
        for step in self.steps.values():
            if step.node.type.group is None:
                continue
            if step.weight == 0:
                continue
            if step in self.seen:
                continue
            steps.append(step)
        if not len(steps):
            return
        return max(steps, key=lambda n: n.weight)

    def expand_step(self, step):
        self.seen.add(step)
        log.debug("Expand: %r (%s)", step, step.weight)
        for link in expand_node(step.node):
            if link.inverted:
                link = link.invert()
            self.links.append(link)
            source = self.add_node(link.subject)
            target = self.add_node(link.value_node)
            target.origins.add(source)
            self.paths.add(Path(self, source, target))
            if target.weight == 0:
                target.weight = target.compute_weight()

    def build(self, steps):
        for i in range(steps):
            if len(self.steps) > 1000:
                break
            step = self.next_step()
            if step is None:
                break
            self.expand_step(step)
