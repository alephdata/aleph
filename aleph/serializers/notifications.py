from banal import ensure_list
from marshmallow import post_dump
from marshmallow.fields import Dict, Raw, String

from aleph.model import Alert, Role, Entity, Collection, Document, Events
from aleph.serializers.roles import RoleSchema
from aleph.serializers.alerts import AlertSchema
from aleph.serializers.entities import CombinedSchema
from aleph.serializers.collections import CollectionSchema
from aleph.serializers.common import BaseSchema


class EventSchema(BaseSchema):
    name = String()
    template = String()


class NotificationSchema(BaseSchema):
    SCHEMATA = {
        Alert: AlertSchema,
        Role: RoleSchema,
        Document: CombinedSchema,
        Entity: CombinedSchema,
        Collection: CollectionSchema
    }

    actor_id = String()
    event = Dict()
    params = Raw()

    def _resolve_alerts(self, cache):
        alerts = set()
        for (type_, id_) in cache.keys():
            if type_ == Alert:
                alerts.add(id_)
        if not len(alerts):
            return
        for role in Alert.all_by_ids(alerts, deleted=True):
            cache[(Alert, str(role.id))] = role

    @post_dump(pass_many=True)
    def expand(self, objs, many=False):
        cache = {}
        for obj in ensure_list(objs):
            event = Events.get(obj['event'])
            cache[(Role, obj.get('actor_id'))] = None
            for param, type_ in event.get('params', {}).items():
                key = obj.get('params', {}).get(param)
                if key is not None:
                    cache[(type_, str(key))] = None

        self._resolve_alerts(cache)
        self._resolve_roles(cache)
        self._resolve_index(cache)

        for obj in ensure_list(objs):
            event = Events.get(obj['event'])
            params = {}
            for param, type_ in event.get('params', {}).items():
                schema = self.SCHEMATA.get(type_)
                key = obj.get('params', {}).get(param)
                if key is None:
                    continue
                value = cache.get((type_, str(key)))
                if value is None:
                    continue
                value, _ = schema().dump(value)
                params[param] = value
            obj['params'] = params
