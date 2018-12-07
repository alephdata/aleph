import logging
from banal import ensure_list, first
from marshmallow import Schema, post_dump

from aleph.model import Role, Alert, Entity, Collection
from aleph.index.entities import entities_by_ids

log = logging.getLogger(__name__)


class ExpandableSchema(Schema):
    EXPAND = []

    def _get_values(self, obj, field):
        value = obj.get(field)
        if isinstance(value, dict):
            value = value.get('id')
        return [str(v) for v in ensure_list(value)]

    def _resolve_roles(self, cache):
        roles = set()
        for (type_, id_) in cache.keys():
            if type_ == Role:
                roles.add(id_)
        if not len(roles):
            return
        for role in Role.all_by_ids(roles, deleted=True):
            cache[(Role, str(role.id))] = role

    def _resolve_collections(self, cache):
        collections = set()
        for (type_, id_) in cache.keys():
            if type_ == Collection:
                collections.add(id_)
        if not len(collections):
            return
        for coll in Collection.all_by_ids(collections, deleted=True):
            cache[(Collection, str(coll.id))] = coll

    def _resolve_entities(self, cache):
        entities = set()
        for (type_, id_) in cache.keys():
            if type_ == Entity:
                entities.add(id_)
        if not len(entities):
            return
        for entity in entities_by_ids(list(entities)):
            cache[(Entity, entity.get('id'))] = entity

    def _resolve_alerts(self, cache):
        alerts = set()
        for (type_, id_) in cache.keys():
            if type_ == Alert:
                alerts.add(id_)
        if not len(alerts):
            return
        for alert in Alert.all_by_ids(alerts, deleted=True):
            cache[(Alert, str(alert.id))] = alert

    @post_dump(pass_many=True)
    def expand(self, objs, many=False):
        cache = {}
        for obj in ensure_list(objs):
            for (field, type_, _, _, _) in self.EXPAND:
                for key in self._get_values(obj, field):
                    cache[(type_, key)] = None

        self._resolve_roles(cache)
        self._resolve_collections(cache)
        self._resolve_entities(cache)

        for obj in ensure_list(objs):
            for (field, type_, target, schema, multi) in self.EXPAND:
                value = []
                for key in self._get_values(obj, field):
                    value.append(cache.get((type_, key)))

                if not multi:
                    value = first(value)

                obj.pop(field, None)
                if value is not None:
                    value, _ = schema().dump(value, many=multi)
                    obj[target] = value
