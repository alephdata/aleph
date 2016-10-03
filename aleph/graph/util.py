
BASE_NODE = 'Aleph'


class GraphType(object):

    @classmethod
    def get(cls, name, **kw):
        if name not in cls._instances:
            cls._instances[name] = cls(name, **kw)
        return cls._instances[name]

    @classmethod
    def all(cls):
        return cls._instances.values()
