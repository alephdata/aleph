# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

from flask_babel import lazy_gettext

from aleph.model.role import Role
from aleph.model.alert import Alert
from aleph.model.entity import Entity
from aleph.model.entityset import EntitySet
from aleph.model.collection import Collection
from aleph.model.export import Export


class Event(object):
    def __init__(self, title, template, params, link_to):
        self.name = None
        self.title = title
        self.template = template
        self.params = params
        self.link_to = link_to

    def to_dict(self):
        return {
            "name": self.name,
            "title": self.title,
            "template": self.template,
            "params": {p: c.__name__.lower() for (p, c) in self.params.items()},
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

    # CREATE COLLECTION
    CREATE_COLLECTION = Event(
        title=lazy_gettext("New datasets"),
        template=lazy_gettext("{{actor}} created {{collection}}"),
        params={"collection": Collection},
        link_to="collection",
    )

    # UPLOAD DOCUMENT
    INGEST_DOCUMENT = Event(
        title=lazy_gettext("Document uploads"),
        template=lazy_gettext("{{actor}} added {{document}} to {{collection}}"),
        params={"document": Entity, "collection": Collection},
        link_to="document",
    )

    # EXECUTE MAPPING
    LOAD_MAPPING = Event(
        title=lazy_gettext("Entities generated"),
        template=lazy_gettext(
            "{{actor}} generated entities from {{table}} in {{collection}}"
        ),
        params={"table": Entity, "collection": Collection},
        link_to="table",
    )

    # CREATE DIAGRAM
    CREATE_DIAGRAM = Event(
        title=lazy_gettext("New network diagram"),
        template=lazy_gettext(
            "{{actor}} began diagramming {{diagram}} in {{collection}}"
        ),
        params={"diagram": EntitySet, "collection": Collection},
        link_to="table",
    )

    # CREATE ENTITYSET
    CREATE_ENTITYSET = Event(
        title=lazy_gettext("New diagrams and lists"),
        template=lazy_gettext("{{actor}} created {{entityset}} in {{collection}}"),
        params={"entityset": EntitySet, "collection": Collection},
        link_to="table",
    )

    # ALERT MATCH
    MATCH_ALERT = Event(
        title=lazy_gettext("Alert notifications"),
        template=lazy_gettext("{{entity}} matches your alert for {{alert}}"),  # noqa
        params={"entity": Entity, "alert": Alert, "role": Role},
        link_to="entity",
    )

    # GRANT COLLECTION
    GRANT_COLLECTION = Event(
        title=lazy_gettext("Dataset access change"),
        template=lazy_gettext(
            "{{actor}} gave {{role}} access to {{collection}}"
        ),  # noqa
        params={"collection": Collection, "role": Role},
        link_to="collection",
    )

    # PUBLISH COLLECTION
    PUBLISH_COLLECTION = Event(
        title=lazy_gettext("Dataset published"),
        template=lazy_gettext("{{actor}} published {{collection}}"),
        params={"collection": Collection},
        link_to="collection",
    )

    # EXPORT PUBLISHED
    COMPLETE_EXPORT = Event(
        title=lazy_gettext("Exports completed"),
        template=lazy_gettext("{{export}} is ready for download"),
        params={"export": Export},
        link_to="export",
    )
