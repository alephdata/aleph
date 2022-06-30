import logging
from pprint import pprint, pformat  # noqa
from flask import request
from flask_babel import gettext
from pantomime.types import PDF, CSV
from banal import ensure_list
from followthemoney import model
from followthemoney.types import registry
from followthemoney.helpers import entity_filename

from aleph.core import url_for
from aleph.logic import resolver
from aleph.logic.entities import check_write_entity, transliterate_values
from aleph.logic.util import collection_url, entity_url, archive_url
from aleph.model import Role, Collection, Document, Entity, Events
from aleph.model import Alert, EntitySet, EntitySetItem, Export
from aleph.views.util import jsonify, clean_object

log = logging.getLogger(__name__)


class Serializer(object):
    def __init__(self, nested=False):
        self.nested = nested

    def collect(self, obj):
        pass

    def _serialize(self, obj):
        return obj

    def _serialize_common(self, obj):
        id_ = obj.pop("id", None)
        if id_ is not None:
            obj["id"] = str(id_)
        obj.pop("_index", None)
        obj["writeable"] = False
        obj["links"] = {}
        obj = self._serialize(obj)
        return clean_object(obj)

    def queue(self, clazz, key, schema=None):
        if not self.nested:
            resolver.queue(request, clazz, key, schema=schema)

    def resolve(self, clazz, key, serializer=None):
        data = resolver.get(request, clazz, key)
        if data is not None and serializer is not None:
            serializer = serializer(nested=True)
            data = serializer.serialize(data)
        return data

    def serialize(self, obj):
        obj = self._to_dict(obj)
        if obj is not None:
            self.collect(obj)
            resolver.resolve(request)
            return self._serialize_common(obj)

    def serialize_many(self, objs):
        collected = []
        for obj in ensure_list(objs):
            obj = self._to_dict(obj)
            if obj is not None:
                self.collect(obj)
                collected.append(obj)
        resolver.resolve(request)
        serialized = []
        for obj in collected:
            obj = self._serialize_common(obj)
            if obj is not None:
                serialized.append(obj)
        return serialized

    def _to_dict(self, obj):
        if hasattr(obj, "to_dict"):
            obj = obj.to_dict()
        if hasattr(obj, "_asdict"):
            obj = obj._asdict()
        return obj

    @classmethod
    def jsonify(cls, obj, **kwargs):
        data = cls().serialize(obj)
        return jsonify(data, **kwargs)

    @classmethod
    def jsonify_result(cls, result, extra=None, **kwargs):
        data = result.to_dict(serializer=cls)
        if extra is not None:
            data.update(extra)
        total = data.get("total", 0)
        if total > 0 and not data.get("results"):
            log.exception(f"Expected more results in the response: {data}")
            data = {
                "status": "error",
                "message": gettext(
                    f"We found {total} results, but could not load them due "
                    "to a technical problem. Please check back later and if "
                    "the problem persists contact an Aleph administrator"
                ),
            }
            return jsonify(data, status=500)
        return jsonify(data, **kwargs)


class RoleSerializer(Serializer):
    def _serialize(self, obj):
        obj["links"] = {"self": url_for("roles_api.view", id=obj.get("id"))}
        obj["writeable"] = request.authz.can_write_role(obj.get("id"))
        obj["shallow"] = obj.get("shallow", True)
        if self.nested or not obj["writeable"]:
            obj.pop("has_password", None)
            obj.pop("is_admin", None)
            obj.pop("is_muted", None)
            obj.pop("is_tester", None)
            obj.pop("is_blocked", None)
            obj.pop("api_key", None)
            obj.pop("email", None)
            obj.pop("locale", None)
            obj.pop("created_at", None)
            obj.pop("updated_at", None)
        if obj["type"] != Role.USER:
            obj.pop("api_key", None)
            obj.pop("email", None)
            obj.pop("locale", None)
        obj.pop("password", None)
        return obj


class AlertSerializer(Serializer):
    def _serialize(self, obj):
        obj["links"] = {"self": url_for("alerts_api.view", alert_id=obj.get("id"))}
        role_id = obj.pop("role_id", None)
        obj["writeable"] = request.authz.can_write_role(role_id)
        return obj


class CollectionSerializer(Serializer):
    def collect(self, obj):
        self.queue(Role, obj.get("creator_id"))
        for role_id in ensure_list(obj.get("team_id")):
            if request.authz.can_read_role(role_id):
                self.queue(Role, role_id)

    def _serialize(self, obj):
        pk = obj.get("id")
        authz = request.authz if obj.get("secret") else None
        obj["links"] = {
            "self": url_for("collections_api.view", collection_id=pk),
            "xref_export": url_for("xref_api.export", collection_id=pk, _authz=authz),
            "reconcile": url_for("reconcile_api.reconcile", collection_id=pk),
            "ui": collection_url(pk),
        }
        obj["shallow"] = obj.get("shallow", True)
        obj["writeable"] = request.authz.can(pk, request.authz.WRITE)
        creator_id = obj.pop("creator_id", None)
        obj["creator"] = self.resolve(Role, creator_id, RoleSerializer)
        obj["team"] = []
        for role_id in ensure_list(obj.pop("team_id", [])):
            if request.authz.can_read_role(role_id):
                role = self.resolve(Role, role_id, RoleSerializer)
                obj["team"].append(role)
        return obj


class PermissionSerializer(Serializer):
    def collect(self, obj):
        self.queue(Role, obj.get("role_id"))

    def _serialize(self, obj):
        obj.pop("collection_id", None)
        role_id = obj.pop("role_id", None)
        obj["writeable"] = request.authz.can_read_role(role_id)  # wat
        obj["role"] = self.resolve(Role, role_id, RoleSerializer)
        return obj


class EntitySerializer(Serializer):
    def collect(self, obj):
        self.queue(Collection, obj.get("collection_id"))
        self.queue(Role, obj.get("role_id"))
        schema = model.get(obj.get("schema"))
        if schema is None or self.nested:
            return
        properties = obj.get("properties", {})
        for name, values in properties.items():
            prop = schema.get(name)
            if prop is None or prop.type != registry.entity:
                continue
            for value in ensure_list(values):
                self.queue(Entity, value, schema=prop.range)

    def _serialize(self, obj):
        proxy = model.get_proxy(dict(obj))
        properties = {}
        for prop, value in proxy.itervalues():
            properties.setdefault(prop.name, [])
            if prop.type == registry.entity and not self.nested:
                entity = self.resolve(Entity, value, EntitySerializer)
                if entity is not None:
                    entity["shallow"] = True
                    value = entity
            if value is not None:
                properties[prop.name].append(value)
        obj["properties"] = properties
        links = {
            "self": url_for("entities_api.view", entity_id=proxy.id),
            "expand": url_for("entities_api.expand", entity_id=proxy.id),
            "tags": url_for("entities_api.tags", entity_id=proxy.id),
            "ui": entity_url(proxy.id),
        }

        if proxy.schema.is_a(Document.SCHEMA):
            content_hash = proxy.first("contentHash", quiet=True)
            if content_hash:
                name = entity_filename(proxy)
                mime = proxy.first("mimeType", quiet=True)
                links["file"] = archive_url(
                    content_hash, file_name=name, mime_type=mime
                )

            pdf_hash = proxy.first("pdfHash", quiet=True)
            if pdf_hash:
                name = entity_filename(proxy, extension="pdf")
                links["pdf"] = archive_url(pdf_hash, file_name=name, mime_type=PDF)

            csv_hash = proxy.first("csvHash", quiet=True)
            if csv_hash:
                name = entity_filename(proxy, extension="csv")
                links["csv"] = archive_url(csv_hash, file_name=name, mime_type=CSV)

        collection = obj.get("collection") or {}
        coll_id = obj.pop("collection_id", collection.get("id"))
        # This is a last resort catcher for entities nested in other
        # entities that get resolved without regard for authz.
        if not request.authz.can(coll_id, request.authz.READ):
            return None
        obj["collection"] = self.resolve(Collection, coll_id, CollectionSerializer)
        role_id = obj.pop("role_id", None)
        obj["role"] = self.resolve(Role, role_id, RoleSerializer)
        obj["links"] = links
        obj["latinized"] = transliterate_values(proxy)
        obj["writeable"] = check_write_entity(obj, request.authz)
        obj["shallow"] = obj.get("shallow", True)
        # Phasing out multi-values here (2021-01):
        obj["created_at"] = min(ensure_list(obj.get("created_at")), default=None)
        obj["updated_at"] = max(ensure_list(obj.get("updated_at")), default=None)
        return obj


class XrefSerializer(Serializer):
    def collect(self, obj):
        matchable = tuple([s for s in model if s.matchable])
        self.queue(Entity, obj.get("entity_id"), matchable)
        self.queue(Entity, obj.get("match_id"), matchable)
        self.queue(Collection, obj.get("collection_id"))
        self.queue(Collection, obj.pop("match_collection_id"))

    def _serialize(self, obj):
        entity_id = obj.pop("entity_id")
        obj["entity"] = self.resolve(Entity, entity_id, EntitySerializer)
        match_id = obj.pop("match_id")
        obj["match"] = self.resolve(Entity, match_id, EntitySerializer)
        collection_id = obj.get("collection_id")
        obj["writeable"] = request.authz.can(collection_id, request.authz.WRITE)
        if obj["entity"] and obj["match"]:
            return obj


class SimilarSerializer(Serializer):
    def collect(self, obj):
        EntitySerializer().collect(obj.get("entity", {}))

    def _serialize(self, obj):
        entity = obj.get("entity", {})
        obj["entity"] = EntitySerializer().serialize(entity)
        collection_id = obj.pop("collection_id")
        obj["writeable"] = request.authz.can(collection_id, request.authz.WRITE)
        return obj


class ExportSerializer(Serializer):
    def _serialize(self, obj):
        if obj.get("content_hash") and not obj.get("deleted"):
            url = archive_url(
                obj.get("content_hash"),
                file_name=obj.get("file_name"),
                mime_type=obj.get("mime_type"),
            )
            obj["links"] = {"download": url}
        return obj


class EntitySetSerializer(Serializer):
    def collect(self, obj):
        self.queue(Collection, obj.get("collection_id"))
        self.queue(Role, obj.get("role_id"))

    def _serialize(self, obj):
        collection_id = obj.pop("collection_id", None)
        obj["shallow"] = obj.get("shallow", True)
        obj["writeable"] = request.authz.can(collection_id, request.authz.WRITE)
        obj["collection"] = self.resolve(
            Collection, collection_id, CollectionSerializer
        )
        role_id = obj.get("role_id", None)
        obj["role"] = self.resolve(Role, role_id, RoleSerializer)
        return obj


class EntitySetItemSerializer(Serializer):
    def collect(self, obj):
        self.queue(Collection, obj.get("collection_id"))
        self.queue(Entity, obj.get("entity_id"))

    def _serialize(self, obj):
        coll_id = obj.pop("collection_id", None)
        # Should never come into effect:
        if not request.authz.can(coll_id, request.authz.READ):
            return None
        entity_id = obj.pop("entity_id", None)
        obj["entity"] = self.resolve(Entity, entity_id, EntitySerializer)
        obj["collection"] = self.resolve(Collection, coll_id, CollectionSerializer)
        esi_coll_id = obj.get("entityset_collection_id")
        obj["writeable"] = request.authz.can(esi_coll_id, request.authz.WRITE)
        return obj


class ProfileSerializer(Serializer):
    def collect(self, obj):
        self.queue(Collection, obj.get("collection_id"))

    def _serialize(self, obj):
        collection_id = obj.pop("collection_id", None)
        obj["writeable"] = request.authz.can(collection_id, request.authz.WRITE)
        obj["shallow"] = obj.get("shallow", True)
        obj["collection"] = self.resolve(
            Collection, collection_id, CollectionSerializer
        )
        proxy = obj.pop("merged")
        data = proxy.to_dict()
        data["latinized"] = transliterate_values(proxy)
        obj["merged"] = data
        items = obj.pop("items", [])
        entities = [i.get("entity") for i in items]
        obj["entities"] = [e.get("id") for e in entities if e is not None]
        obj.pop("proxies", None)
        return obj


class NotificationSerializer(Serializer):
    SERIALIZERS = {
        Alert: AlertSerializer,
        Entity: EntitySerializer,
        Collection: CollectionSerializer,
        EntitySet: EntitySetSerializer,
        EntitySetItem: EntitySetItemSerializer,
        Role: RoleSerializer,
        Export: ExportSerializer,
    }

    def collect(self, obj):
        self.queue(Role, obj.get("actor_id"))
        event = Events.get(obj.get("event"))
        if event is not None:
            for name, clazz in event.params.items():
                key = obj.get("params", {}).get(name)
                self.queue(clazz, key, Entity.THING)

    def _serialize(self, obj):
        event = Events.get(obj.get("event"))
        if event is None:
            return None
        params = {"actor": self.resolve(Role, obj.get("actor_id"), RoleSerializer)}
        for name, clazz in event.params.items():
            key = obj.get("params", {}).get(name)
            serializer = self.SERIALIZERS.get(clazz)
            params[name] = self.resolve(clazz, key, serializer)
        obj["params"] = params
        obj["event"] = event.to_dict()
        return obj


class MappingSerializer(Serializer):
    def collect(self, obj):
        self.queue(EntitySet, obj.get("entityset_id"))
        self.queue(Entity, obj.get("table_id"))

    def _serialize(self, obj):
        obj["links"] = {}
        entityset_id = obj.pop("entityset_id", None)
        obj["entityset"] = self.resolve(EntitySet, entityset_id, EntitySetSerializer)
        obj["table"] = self.resolve(Entity, obj.get("table_id", None), EntitySerializer)
        return obj
