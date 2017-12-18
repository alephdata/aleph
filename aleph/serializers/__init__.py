from marshmallow import Schema, post_dump
from marshmallow.fields import Nested, Integer, String, DateTime
from marshmallow.fields import Dict, Float

from aleph.core import url_for
from aleph.serializers.common import BaseSchema
from aleph.serializers.roles import RoleReferenceSchema
from aleph.serializers.collections import CollectionSchema
from aleph.serializers.entities import ShallowCombinedSchema
from aleph.model import Entity


class AlertSchema(BaseSchema):
    query_text = String()
    entity_id = String()
    label = String()
    role = Nested(RoleReferenceSchema, dump_only=True)
    notified_at = DateTime(dump_only=True)

    @post_dump
    def transient(self, data):
        data['uri'] = url_for('alerts_api.view', id=data.get('id'))
        data['writeable'] = True
        return data


class RecordSchema(Schema):
    id = String(dump_only=True)
    document_id = String(dump_only=True)
    index = Integer(dump_only=True)
    text = String(dump_only=True)
    data = Dict(dump_only=True)

    @post_dump
    def transient(self, data):
        data['uri'] = url_for('documents_api.record',
                              document_id=data.get('document_id'),
                              index=data.get('index'))
        return data


class MatchSchema(BaseSchema):
    EXPAND = [
        ('entity_id', Entity, 'entity', ShallowCombinedSchema, False),
        ('match_id', Entity, 'match', ShallowCombinedSchema, False),
    ]

    entity_id = String()
    match_id = String()
    score = Float(dump_only=True)


class MatchCollectionsSchema(BaseSchema):
    matches = Integer(dump_only=True)
    parent = Integer(dump_only=True)
    collection = Nested(CollectionSchema, required=True)

    @post_dump
    def transient(self, data):
        data['uri'] = url_for('xref_api.matches',
                              id=data.pop('parent'),
                              other_id=data.get('collection').get('id'))
