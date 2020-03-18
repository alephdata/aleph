import logging
# from pprint import pprint
from flask import request
from normality import stringify
from pantomime.types import PDF, CSV
from banal import ensure_list, is_listish, is_mapping, first
from followthemoney import model
from followthemoney.types import registry
from followthemoney.helpers import entity_filename

from aleph.core import url_for
from aleph.model import Role, Collection, Document, Entity, Events, Alert
from aleph.logic import resolver
from aleph.logic.util import collection_url, entity_url, archive_url
from aleph.views.util import jsonify

log = logging.getLogger(__name__)


class Serializer(object):

    def __init__(self, reference=False):
        self.reference = reference

    def _collect(self, obj):
        pass

    def _serialize(self, obj):
        return obj

    def queue(self, clazz, key, schema=None):
        if not self.reference:
            resolver.queue(request, clazz, key, schema=schema)

    def resolve(self, clazz, key, serializer=None):
        if self.reference:
            return
        data = resolver.get(request, clazz, key)
        if data is not None and serializer is not None:
            serializer = serializer(reference=True)
            data = serializer.serialize(data)
        return data

    def serialize(self, obj):
        obj = self._to_dict(obj)
        if obj is not None:
            self._collect(obj)
            resolver.resolve(request)
            return self._serialize(obj)

    def serialize_many(self, objs):
        collected = []
        for obj in ensure_list(objs):
            obj = self._to_dict(obj)
            if obj is not None:
                self._collect(obj)
                collected.append(obj)
        resolver.resolve(request)
        serialized = []
        for obj in collected:
            obj = self._serialize(obj)
            if obj is not None:
                serialized.append(obj)
        return serialized

    def _to_dict(self, obj):
        if hasattr(obj, 'to_dict'):
            obj = obj.to_dict()
        if hasattr(obj, '_asdict'):
            obj = obj._asdict()
        return obj

    def _clean_response(self, data):
        """Remove unset values from the response to save some bandwidth."""
        if is_mapping(data):
            out = {}
            for k, v in data.items():
                v = self._clean_response(v)
                if v is not None:
                    out[k] = v
            return out if len(out) else None
        elif is_listish(data):
            data = [self._clean_response(d) for d in data]
            data = [d for d in data if d is not None]
            return data if len(data) else None
        elif isinstance(data, str):
            return data if len(data) else None
        return data

    @classmethod
    def jsonify(cls, obj, **kwargs):
        data = cls().serialize(obj)
        return jsonify(data, **kwargs)

    @classmethod
    def jsonify_result(cls, result, extra=None, **kwargs):
        data = result.to_dict(serializer=cls)
        if extra is not None:
            data.update(extra)
        return jsonify(data, **kwargs)


class RoleSerializer(Serializer):

    def _serialize(self, obj):
        obj['id'] = str(obj.get('id'))
        obj['links'] = {
            'self': url_for('roles_api.view', id=obj.get('id'))
        }
        obj['writeable'] = request.authz.can_write_role(obj.get('id'))
        if not obj['writeable']:
            obj.pop('has_password', None)
            obj.pop('is_muted', None)
            obj.pop('is_tester', None)
            obj.pop('is_blocked', None)
            obj.pop('api_key', None)
            obj.pop('email', None)
            obj.pop('created_at', None)
            obj.pop('updated_at', None)
        if obj['type'] != Role.USER:
            obj.pop('api_key', None)
            obj.pop('email', None)
            obj.pop('locale', None)
        obj.pop('password', None)
        return self._clean_response(obj)


class AlertSerializer(Serializer):

    # def _collect(self, obj):
    #     self.queue(Role, obj.get('role_id'))

    def _serialize(self, obj):
        pk = obj.get('id')
        obj['id'] = str(pk)
        obj['links'] = {
            'self': url_for('alerts_api.view', alert_id=pk)
        }
        role_id = obj.pop('role_id', None)
        obj['writeable'] = role_id == stringify(request.authz.id)
        # obj['role'] = self.resolve(Role, role_id, RoleSerializer)
        return obj


class CollectionSerializer(Serializer):

    def _collect(self, obj):
        self.queue(Role, obj.get('creator_id'))
        for role_id in ensure_list(obj.get('team_id')):
            self.queue(Role, role_id)

    def _serialize(self, obj):
        pk = obj.get('id')
        obj['id'] = str(pk)
        obj['links'] = {
            'self': url_for('collections_api.view', collection_id=pk),
            'xref': url_for('xref_api.index', collection_id=pk),
            'xref_export': url_for('xref_api.export', collection_id=pk,
                                   _authorize=obj.get('secret')),
            'reconcile': url_for('reconcile_api.reconcile',
                                 collection_id=pk,
                                 _authorize=obj.get('secret')),
            'ui': collection_url(pk)
        }
        obj['writeable'] = request.authz.can(pk, request.authz.WRITE)
        creator_id = obj.pop('creator_id', None)
        obj['creator'] = self.resolve(Role, creator_id, RoleSerializer)
        team_id = ensure_list(obj.pop('team_id', []))
        if obj['writeable']:
            obj['team'] = []
            for role_id in team_id:
                role = self.resolve(Role, role_id, RoleSerializer)
                if role is not None:
                    obj['team'].append(role)
        obj.pop('_index', None)
        return self._clean_response(obj)


class PermissionSerializer(Serializer):

    def _collect(self, obj):
        self.queue(Role, obj.get('role_id'))

    def _serialize(self, obj):
        obj.pop('collection_id', None)
        role_id = obj.pop('role_id', None)
        obj['role'] = self.resolve(Role, role_id, RoleSerializer)
        return obj


class EntitySerializer(Serializer):

    def _collect(self, obj):
        self.queue(Collection, obj.get('collection_id'))
        self.queue(Role, obj.get('uploader_id'))
        schema = model.get(obj.get('schema'))
        if schema is None:
            return
        properties = obj.get('properties', {})
        for prop in schema.properties.values():
            if prop.type != registry.entity:
                continue
            values = ensure_list(properties.get(prop.name))
            for value in values:
                self.queue(Entity, value, prop.range)

    def _serialize(self, obj):
        pk = obj.get('id')
        obj['id'] = str(pk)
        authz = request.authz
        collection_id = obj.pop('collection_id', None)
        obj['collection'] = self.resolve(Collection, collection_id,
                                         CollectionSerializer)
        proxy = model.get_proxy(obj)
        obj['schemata'] = proxy.schema.names
        properties = obj.get('properties', {})
        for prop in proxy.iterprops():
            if prop.type != registry.entity:
                continue
            values = ensure_list(properties.get(prop.name))
            properties[prop.name] = []
            for value in values:
                entity = self.resolve(Entity, value, EntitySerializer)
                properties[prop.name].append(entity)

        links = {
            'self': url_for('entities_api.view', entity_id=pk),
            'references': url_for('entities_api.references', entity_id=pk),
            'tags': url_for('entities_api.tags', entity_id=pk),
            'ui': entity_url(pk)
        }
        if proxy.schema.is_a(Document.SCHEMA):
            links['content'] = url_for('entities_api.content', entity_id=pk)
            content_hash = first(properties.get('contentHash'))
            if content_hash:
                name = entity_filename(proxy)
                mime_type = first(properties.get('mimeType'))
                links['file'] = archive_url(request.authz.id, content_hash,
                                            file_name=name,
                                            mime_type=mime_type)

            pdf_hash = first(properties.get('pdfHash'))
            if pdf_hash:
                name = entity_filename(proxy, extension='pdf')
                links['pdf'] = archive_url(request.authz.id, pdf_hash,
                                           file_name=name, mime_type=PDF)
            csv_hash = first(properties.get('csvHash'))
            if csv_hash:
                name = entity_filename(proxy, extension='csv')
                links['csv'] = archive_url(request.authz.id, csv_hash,
                                           file_name=name, mime_type=CSV)

        obj['links'] = links
        obj['writeable'] = authz.can(collection_id, authz.WRITE)
        obj.pop('_index', None)
        return self._clean_response(obj)


class MatchCollectionsSerializer(Serializer):

    def _serialize(self, obj):
        serializer = CollectionSerializer(reference=True)
        obj['collection'] = serializer.serialize(obj.get('collection'))
        return obj


class MatchSerializer(Serializer):

    def _collect(self, obj):
        matchable = tuple([s.matchable for s in model])
        self.queue(Entity, obj.get('entity_id'), matchable)
        self.queue(Entity, obj.get('match_id'), matchable)

    def _serialize(self, obj):
        obj['id'] = str(obj['id'])
        entity_id = obj.pop('entity_id', None)
        obj['entity'] = self.resolve(Entity, entity_id, EntitySerializer)
        match_id = obj.pop('match_id', None)
        obj['match'] = self.resolve(Entity, match_id, EntitySerializer)
        if obj['entity'] and obj['match']:
            return obj


class QueryLogSerializer(Serializer):
    pass


class NotificationSerializer(Serializer):
    SERIALIZERS = {
        Alert: AlertSerializer,
        Entity: EntitySerializer,
        Collection: CollectionSerializer,
        Role: RoleSerializer
    }

    def _collect(self, obj):
        self.queue(Role, obj.get('actor_id'))
        event = Events.get(obj.get('event'))
        for name, clazz in event.params.items():
            key = obj.get('params', {}).get(name)
            self.queue(clazz, key, Entity.THING)

    def _serialize(self, obj):
        obj['id'] = str(obj['id'])
        event = Events.get(obj.get('event'))
        params = {
            'actor': self.resolve(Role, obj.get('actor_id'), RoleSerializer)
        }
        for name, clazz in event.params.items():
            key = obj.get('params', {}).get(name)
            serializer = self.SERIALIZERS.get(clazz)
            params[name] = self.resolve(clazz, key, serializer)
        obj['params'] = params
        obj['event'] = event.to_dict()
        return obj


class MappingSerializer(Serializer):
    pass


class DiagramEntitySerializer(EntitySerializer):

    def _serialize(self, obj):
        pk = obj.get('id')
        obj['id'] = str(pk)
        schema = model.get(obj.get('schema'))
        if schema is None:
            return None
        properties = obj.get('properties', {})
        for prop in schema.properties.values():
            if prop.type != registry.entity:
                continue
            values = ensure_list(properties.get(prop.name))
            if values:
                properties[prop.name] = []
                for value in values:
                    entity = self.resolve(Entity, value, DiagramEntitySerializer)  # noqa
                    if entity is None:
                        entity = value
                    properties[prop.name].append(entity)
        obj.pop('_index', None)
        collection_id = obj.pop('collection_id', None)
        obj['collection_id'] = str(collection_id)
        return self._clean_response(obj)


class DiagramSerializer(Serializer):

    def _collect(self, obj):
        self.queue(Collection, obj.get('collection_id'))
        ent_ids = obj['entities']
        for ent_id in ensure_list(ent_ids):
            self.queue(Entity, ent_id)

    def _serialize(self, obj):
        pk = obj.get('id')
        collection_id = obj.pop('collection_id', None)
        entity_ids = obj.pop('entities', [])
        obj.update({
            'id': str(pk),
            'shallow': False,
            'writeable': request.authz.can(collection_id, request.authz.WRITE),
            'collection': self.resolve(Collection, collection_id, CollectionSerializer),  # noqa
            'entities': []
        })
        for ent_id in entity_ids:
            entity = self.resolve(Entity, ent_id, DiagramEntitySerializer)
            if entity is not None:
                obj['entities'].append(entity)
        for ent in obj['entities']:
            schema = model.get(ent.get('schema'))
            properties = ent.get('properties', {})
            for prop in schema.properties.values():
                if prop.type != registry.entity:
                    continue
                values = ensure_list(properties.get(prop.name))
                if values:
                    properties[prop.name] = []
                    for value in values:
                        entity = self.resolve(Entity, value, DiagramEntitySerializer)  # noqa
                        properties[prop.name].append(entity)
        return self._clean_response(obj)


class DiagramIndexSerializer(Serializer):

    def _collect(self, obj):
        self.queue(Collection, obj.get('collection_id'))

    def _serialize(self, obj):
        pk = obj.get('id')
        collection_id = obj.pop('collection_id', None)
        obj.update({
            'id': str(pk),
            'shallow': False,
            'writeable': request.authz.can(collection_id, request.authz.WRITE),
            'collection': self.resolve(Collection, collection_id, CollectionSerializer),  # noqa
        })
        return self._clean_response(obj)
