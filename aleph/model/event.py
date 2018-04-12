from flask.ext.babel import lazy_gettext

from aleph.model.role import Role
from aleph.model.alert import Alert
from aleph.model.entity import Entity
from aleph.model.document import Document
from aleph.model.collection import Collection


class Event(object):

    def __init__(self, template, link, params):
        self.name = None
        self.template = template
        self.link = link
        self.params = params


class EventsRegistry(type):

    def __init__(cls, name, bases, dct):
        cls.registry = {}
        for ename, event in dct.items():
            if isinstance(event, Event):
                event.name = ename
                cls.registry[ename] = event
        super(EventsRegistry, cls).__init__(name, bases, dct)


class Events(object):
    __metaclass__ = EventsRegistry

    @classmethod
    def get(cls, name):
        return cls.registry.get(name)

    @classmethod
    def names(cls):
        return cls.registry.keys()

    # UPDATE COLLECTION (collection)
    UPDATE_COLLECTION = Event(
        template=lazy_gettext('{{actor}} changed the settings of {{collection}}.'),  # noqa
        link='collection',
        params={'collection': Collection}
    )

    # UPLOAD DOCUMENT (document)
    INGEST_DOCUMENT = Event(
        template=lazy_gettext('{{actor}} uploaded {{document}} to {{collection}}.'),  # noqa
        link='document',
        params={
            'document': Document,
            'collection': Collection
        }
    )

    # ALERT MATCH (entity)
    MATCH_ALERT = Event(
        template=lazy_gettext('{{entity}} matches your alert for {{alert}}.'),  # noqa
        link='entity',
        params={
            'entity': Entity,
            'alert': Alert,
            'role': Role
        }
    )

    # GRANT COLLECTION (collection, role)
    GRANT_COLLECTION = Event(
        template=lazy_gettext('{{actor}} gave {{role}} access to {{collection}}.'),  # noqa
        link='collection',
        params={
            'collection': Collection,
            'role': Role
        }
    )

    # PUBLISH COLLECTION (collection)
    PUBLISH_COLLECTION = Event(
        template='{{actor}} published {{collection}}.',
        link='collection',
        params={'collection': Collection}
    )

    # REVOKE COLLECTION (collection, role)
    REVOKE_COLLECTION = Event(
        template=lazy_gettext('{{actor}} removed access to {{collection}} from {{role}}.'),  # noqa
        link='collection',
        params={
            'collection': Collection,
            'role': Role
        }
    )
