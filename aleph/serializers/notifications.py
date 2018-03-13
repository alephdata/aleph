import logging
from banal import ensure_list
from marshmallow import pre_dump, post_dump
from marshmallow.fields import Dict, Raw, String, Nested, Field

from aleph.model import Alert, Role, Entity, Collection, Document, Events
from aleph.serializers.roles import RoleSchema
from aleph.serializers.alerts import AlertSchema
from aleph.serializers.entities import CombinedSchema
from aleph.serializers.collections import CollectionSchema
from aleph.serializers.common import BaseSchema

log = logging.getLogger(__name__)


class ParamTypes(Field):
    def _serialize(self, value, attr, obj):
        out = {}
        for param, clazz in value.items():
            out[param] = clazz.__name__.lower()
        return out


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

    def _resolve_alerts(self, cache):
        alerts = set()
        for (type_, id_) in cache.keys():
            if type_ == Alert:
                alerts.add(id_)
        if not len(alerts):
            return
        for alert in Alert.all_by_ids(alerts, deleted=True):
            cache[(Alert, str(alert.id))] = role

    @pre_dump(pass_many=True)
    def expand(self, objs, many=False):
        cache = {}
        for obj in ensure_list(objs):
            for name, clazz, value in obj.iterparams():
                cache[(clazz, str(value))] = None

        self._resolve_alerts(cache)
        self._resolve_roles(cache)
        self._resolve_index(cache)

        for obj in ensure_list(objs):
            params = {}
            for name, clazz, value in obj.iterparams():
                schema = self.SCHEMATA.get(clazz)
                value = cache.get((clazz, str(value)))
                if value is not None:
                    params[name], _ = schema().dump(value)
            obj.params = params
