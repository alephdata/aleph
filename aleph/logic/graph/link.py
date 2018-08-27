from followthemoney import model
from followthemoney.types import registry


class Link(object):

    def __init__(self, ref, prop, value, weight=1.0, inverted=False):
        self.ref = ref
        self.prop = prop
        self.value = value
        self.weight = weight
        self.inverted = inverted

    @property
    def subject(self):
        return registry.deref(self.ref)[1]

    @property
    def value_ref(self):
        return self.prop.type.ref(self.value)

    def pack(self):
        qualifier = '*' if self.inverted else ''
        if self.weight < 1.0:
            qualifier += self.weight
        return f'{self.prop.qname}>{qualifier}>{self.value}'

    @classmethod
    def unpack(cls, ref, packed):
        qname, qualifier, value = packed.split('>', 2)
        prop = model.get_qname(qname)
        # TODO: parse qualifier
        return cls(ref, prop, value)

    def invert(self):
        return Link(self.value_ref, self.prop, self.subject,
                    weight=self.weight,
                    inverted=not self.inverted)
