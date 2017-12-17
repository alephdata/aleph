from flask import request
from marshmallow import Schema, post_dump
from marshmallow.fields import Nested, Integer, String, DateTime, List
from marshmallow.fields import Dict, Boolean, Float
from marshmallow.validate import Length

from aleph.core import url_for
from aleph.logic.entities import entity_url
from aleph.logic.documents import document_url
from aleph.serializers.common import BaseSchema, SchemaName, PartialDate
from aleph.serializers.common import Country, Language
from aleph.serializers.roles import RoleReferenceSchema
from aleph.serializers.collections import CollectionSchema
from aleph.serializers.entities import CombinedSchema
from aleph.model import Document, Entity, Collection
from aleph.util import ensure_list


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
    entity = Nested(CombinedSchema, required=True)
    match = Nested(CombinedSchema, required=True)
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
