import logging
from banal import ensure_list, first, is_mapping
from marshmallow import Schema, post_dump

from aleph.model import Role, Alert, Entity, Collection
from aleph.logic.collections import get_collection
from aleph.logic.entities import get_entity
from aleph.logic.roles import get_role
from aleph.logic.alerts import get_alert

log = logging.getLogger(__name__)

LOADERS = {
    Role: get_role,
    Collection: get_collection,
    Entity: get_entity,
    Alert: get_alert
}


class ExpandableSchema(Schema):
    EXPAND = []

    def _get_values(self, obj, field):
        value = obj.get(field)
        if is_mapping(value):
            value = value.get('id')
        return [str(v) for v in ensure_list(value)]

    def _get_object(self, clazz, key):
        return LOADERS[clazz](key)

    @post_dump(pass_many=True)
    def expand(self, objs, many=False):
        cache = {}
        for obj in ensure_list(objs):
            for (field, type_, target, schema, multi) in self.EXPAND:
                value = []
                for key in self._get_values(obj, field):
                    if (type_, key) not in cache:
                        cache[(type_, key)] = self._get_object(type_, key)
                    value.append(cache.get((type_, key)))

                if not multi:
                    value = first(value)

                obj.pop(field, None)
                if value is not None:
                    value, _ = schema().dump(value, many=multi)
                    obj[target] = value
