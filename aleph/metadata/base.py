

class Field(object):
    """Define a metadata field."""

    def __init__(self, name=None, label=None, multi=False,
                 protected=False):
        self.name = name
        self.label = label
        self.multi = multi
        self.protected = protected

    def init(self, meta, attr):
        self.attr = attr
        self.name = self.name or attr
        meta.fields[self.name] = self


class MetadataFactory(type):
    """Read the fields metadata and make it available in an attribute."""

    def __new__(cls, name, parents, dct):
        meta = super(MetadataFactory, cls).__new__(cls, name, parents, dct)
        meta.fields = {}
        for attr, item in dct.items():
            if isinstance(item, Field):
                item.init(meta, attr)
        return meta
