from flask_babel import lazy_gettext

from aleph.model.role import Role
from aleph.model.alert import Alert
from aleph.model.entity import Entity
from aleph.model.diagram import Diagram
from aleph.model.collection import Collection


class Event(object):

    def __init__(self, template, params, link_to):
        self.name = None
        self.template = template
        self.params = params
        self.link_to = link_to

    def to_dict(self):
        return {
            'name': self.name,
            'template': self.template,
            'params': {p: c.__name__.lower() for (p, c) in self.params.items()}
        }


class EventsRegistry(type):

    def __init__(cls, name, bases, dct):
        cls.registry = {}
        for ename, event in dct.items():
            if isinstance(event, Event):
                event.name = ename
                cls.registry[ename] = event
        super(EventsRegistry, cls).__init__(name, bases, dct)


class Events(object, metaclass=EventsRegistry):

    @classmethod
    def get(cls, name):
        return cls.registry.get(name)

    @classmethod
    def names(cls):
        return list(cls.registry.keys())

    # CREATE COLLECTION (collection)
    CREATE_COLLECTION = Event(
        template=lazy_gettext('{{actor}} created {{collection}}'),  # noqa
        params={'collection': Collection},
        link_to='collection'
    )

    # # UPDATE COLLECTION (collection)
    UPDATE_COLLECTION = Event(
        template=lazy_gettext('{{actor}} changed the settings of {{collection}}'),  # noqa
        params={'collection': Collection},
        link_to='collection'
    )

    # UPLOAD DOCUMENT (document)
    INGEST_DOCUMENT = Event(
        template=lazy_gettext('{{actor}} added {{document}} to {{collection}}'),  # noqa
        params={
            'document': Entity,
            'collection': Collection
        },
        link_to='document'
    )

    # EXECUTE MAPPING (document)
    LOAD_MAPPING = Event(
        template=lazy_gettext('{{actor}} generated entities from {{table}} in {{collection}}'),  # noqa
        params={
            'table': Entity,
            'collection': Collection
        },
        link_to='table'
    )

    # CREATE DIAGRAM (document)
    CREATE_DIAGRAM = Event(
        template=lazy_gettext('{{actor}} began diagramming {{diagram}} in {{collection}}'),  # noqa
        params={
            'diagram': Diagram,
            'collection': Collection
        },
        link_to='table'
    )

    # ALERT MATCH (entity)
    MATCH_ALERT = Event(
        template=lazy_gettext('{{entity}} matches your alert for {{alert}}'),  # noqa
        params={
            'entity': Entity,
            'alert': Alert,
            'role': Role
        },
        link_to='entity'
    )

    # GRANT COLLECTION (collection, role)
    GRANT_COLLECTION = Event(
        template=lazy_gettext('{{actor}} gave {{role}} access to {{collection}}'),  # noqa
        params={
            'collection': Collection,
            'role': Role
        },
        link_to='collection'
    )

    # PUBLISH COLLECTION (collection)
    PUBLISH_COLLECTION = Event(
        template='{{actor}} published {{collection}}',
        params={'collection': Collection},
        link_to='collection'
    )
