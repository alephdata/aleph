import logging
from banal import ensure_list
from marshmallow import pre_dump
from marshmallow.fields import Raw, String, Nested, Field

from aleph.model import Alert, Role, Entity, Collection, Document
from aleph.serializers.roles import RoleSchema
from aleph.serializers.alerts import AlertSchema
from aleph.serializers.entities import CombinedSchema
from aleph.serializers.collections import CollectionSchema
from aleph.serializers.common import BaseSchema

log = logging.getLogger(__name__)


class ParamTypes(Field):
    def _serialize(self, value, attr, obj):
        return {p: c.__name__.lower() for (p, c) in value.items()}


class EventSchema(BaseSchema):
    name = String()
    template = String()
    params = ParamTypes()


class NotificationSchema(BaseSchema):
    SCHEMATA = {
        Alert: AlertSchema,
        Role: RoleSchema,
        Document: CombinedSchema,
        Entity: CombinedSchema,
        Collection: CollectionSchema
    }

    actor_id = String()
    event = Nested(EventSchema(), dump_only=True)
    params = Raw()

    @pre_dump(pass_many=True)
    def expand(self, objs, many=False):
        cache = {}
        for obj in ensure_list(objs):
            for name, clazz, value in obj.iterparams():
                cache[(clazz, str(value))] = None

        self._resolve_alerts(cache)
        self._resolve_roles(cache)
        self._resolve_entities(cache)
        self._resolve_collections(cache)

        results = []
        for obj in ensure_list(objs):
            params = {}
            for name, clazz, value in obj.iterparams():
                schema = self.SCHEMATA.get(clazz)
                value = cache.get((clazz, str(value)))
                if value is not None:
                    params[name], _ = schema().dump(value)
            results.append({
                'id': obj.id,
                'created_at': obj.created_at,
                'actor_id': obj.actor_id,
                'event': obj.event,
                'params': params
            })
        return results
