import logging
from flask import request
from banal import ensure_list
from normality import stringify
from followthemoney import model

from aleph.core import url_for
from aleph.model import Role, Collection, Document, Entity
from aleph.logic import resolver
from aleph.logic.util import collection_url, entity_url
from aleph.views.util import jsonify

log = logging.getLogger(__name__)


class Serializer(object):

    def __init__(self, reference=False):
        self.reference = reference

    def _collect(self, obj):
        pass

    def _serialize(self, obj):
        return obj

    def queue(self, clazz, key):
        if not self.reference:
            resolver.queue(request, clazz, key)

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

    @classmethod
    def jsonify(cls, obj, **kwargs):
        data = cls().serialize(obj)
        return jsonify(data, **kwargs)

    @classmethod
    def jsonify_result(cls, result, **kwargs):
        data = result.to_dict(serializer=cls)
        return jsonify(data, **kwargs)


class RoleSerializer(Serializer):

    def _serialize(self, obj):
        obj['links'] = {
            'self': url_for('roles_api.view', id=obj.get('id'))
        }
        writeable = obj.get('id') == stringify(request.authz.id)
        writeable = writeable or request.authz.is_admin
        obj['writeable'] = writeable
        if writeable:
            obj.pop('has_password', None)
            obj.pop('api_key', None)
            obj.pop('email', None)
        if obj['type'] != Role.USER:
            obj.pop('api_key', None)
            obj.pop('email', None)
        obj.pop('password', None)
        return obj


class AlertSerializer(Serializer):

    # def _collect(self, obj):
    #     self.queue(Role, obj.get('role_id'))

    def _serialize(self, obj):
        pk = obj.get('id')
        obj['links'] = {
            'self': url_for('alerts_api.view', id=pk)
        }
        role_id = obj.pop('role_id', None)
        obj['writeable'] = role_id == stringify(request.authz.id)
        # obj['role'] = self.resolve(Role, role_id, RoleSerializer)
        return obj


class CollectionSerializer(Serializer):

    def _collect(self, obj):
        self.queue(Role, obj.get('creator_id'))

    def _serialize(self, obj):
        pk = obj.get('id')
        obj['links'] = {
            'self': url_for('collections_api.view', id=pk),
            'xref': url_for('xref_api.index', id=pk),
            'xref_csv': url_for('xref_api.csv_export', id=pk, _authorize=True),
            'ui': collection_url(pk)
        }
        obj['writeable'] = request.authz.can(pk, request.authz.WRITE)
        creator_id = obj.pop('creator_id', None)
        obj['creator'] = self.resolve(Role, creator_id, RoleSerializer)
        obj.pop('_index', None)
        return obj


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

    def _serialize(self, obj):
        pk = obj.get('id')
        authz = request.authz
        collection_id = obj.pop('collection_id', None)
        obj['collection'] = self.resolve(Collection, collection_id,
                                         CollectionSerializer)
        schema = model.get(obj.get('schema'))
        if schema is None:
            return
        obj['schemata'] = schema.names
        links = {
            'self': url_for('entities_api.view', id=pk),
            'references': url_for('entities_api.references', id=pk),
            'tags': url_for('entities_api.tags', id=pk),
            'ui': entity_url(pk)
        }
        if schema.is_a(Document.SCHEMA):
            links['content'] = url_for('documents_api.content', document_id=pk)
        # if data.get('content_hash'):
        #     links['file'] = url_for('documents_api.file',
        #                             document_id=pk,
        #                             _authorize=True)
        # if schemata.intersection([Document.SCHEMA_PDF]):
        #     links['pdf'] = url_for('documents_api.pdf',
        #                            document_id=pk,
        #                            _authorize=True)

        obj['links'] = links
        obj['writeable'] = authz.can(collection_id, authz.WRITE)
        if obj.get('bulk'):
            obj['writeable'] = False
        obj.pop('_index', None)
        return obj


class MatchCollectionsSerializer(Serializer):
    # matches = Integer(dump_only=True)
    # parent = Integer(dump_only=True)
    # collection = Nested(CollectionSchema, required=True)
    pass


class MatchSerializer(Serializer):

    def _collect(self, obj):
        self.queue(Entity, obj.get('entity_id'))
        self.queue(Entity, obj.get('match_id'))

    def _serialize(self, obj):
        entity_id = obj.pop('entity_id', None)
        obj['entity'] = self.resolve(Entity, entity_id, EntitySerializer)
        match_id = obj.pop('match_id', None)
        obj['match'] = self.resolve(Entity, match_id, EntitySerializer)
        return obj


class QueryLogSerializer(Serializer):
    pass


class NotificationSerializer(Serializer):
    pass


class RecordSerializer(Serializer):
    pass
