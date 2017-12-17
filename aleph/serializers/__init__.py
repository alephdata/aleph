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


class EntityBaseSchema(BaseSchema):
    collection_id = Integer(required=True)
    # TODO: ^ make this optional and derive an EntityCreateSchema.
    collection = Nested(CollectionSchema(), allow_none=True)
    schema = SchemaName(required=True)
    schemata = List(SchemaName(), dump_only=True)
    names = List(String(), dump_only=True)
    addresses = List(String(), dump_only=True)
    phones = List(String(), dump_only=True)
    emails = List(String(), dump_only=True)
    identifiers = List(String(), dump_only=True)
    countries = List(Country(), dump_only=True)
    dates = List(PartialDate(), dump_only=True)
    bulk = Boolean(dump_only=True)


class EntitySchema(EntityBaseSchema):
    EXPAND = [
        ('collection_id', Collection, 'collection', False),
        ('entities', Entity, 'related', True),
    ]

    foreign_ids = List(String())
    name = String(validate=Length(min=2, max=500), required=True)
    entities = List(String(), dump_only=True)
    related = List(Nested(EntityBaseSchema()), dump_only=True)
    properties = Dict()

    @post_dump
    def transient(self, data):
        data['uri'] = url_for('entities_api.view', id=data.get('id'))
        data['ui'] = entity_url(data.get('id'))
        if data.get('bulk'):
            data['writeable'] = False
        else:
            collection_id = data.get('collection_id')
            data['writeable'] = request.authz.can_write(collection_id)
        return data


class DocumentBaseSchema(EntityBaseSchema):
    status = String(dump_only=True)
    foreign_id = String(allow_none=True)
    content_hash = String(dump_only=True)
    uploader_id = Integer(dump_only=True)
    # TODO: uploader
    error_message = String(dump_only=True)
    title = String(allow_none=True)
    summary = String(allow_none=True)
    languages = List(Language())
    keywords = List(String(validate=Length(min=1, max=5000)))
    date = PartialDate(allow_none=True)
    authored_at = PartialDate(allow_none=True)
    modified_at = PartialDate(allow_none=True)
    published_at = PartialDate(allow_none=True)
    retrieved_at = PartialDate(allow_none=True)
    file_name = String(allow_none=True)
    file_size = Integer(dump_only=True)
    author = String(allow_none=True)
    generator = String(allow_none=True)
    mime_type = String(allow_none=True)
    extension = String(dump_only=True)
    encoding = String(dump_only=True)
    source_url = String(allow_none=True)
    pdf_version = String(dump_only=True)
    text = String(dump_only=True)
    html = String(dump_only=True)
    columns = List(String(), dump_only=True)
    children = Integer(dump_only=True)

    @post_dump
    def transient(self, data):
        data['uri'] = url_for('documents_api.view',
                              document_id=data.get('id'))
        data['ui'] = document_url(data.get('id'))
        collection_id = data.get('collection_id')
        data['writeable'] = request.authz.can_write(collection_id)
        return data


class DocumentSchema(DocumentBaseSchema):
    EXPAND = [
        ('collection_id', Collection, 'collection', False),
        ('uploader_id', Document, 'uploader', False),
        ('parent', Document, 'parent', False),
    ]

    parent = Nested(DocumentBaseSchema(), allow_none=True)


class RecordSchema(Schema):
    id = String(dump_only=True)
    document_id = Integer(dump_only=True)
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
    entity = Nested(EntitySchema, required=True)
    match = Nested(EntitySchema, required=True)
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


class SearchResultSchema(object):
    """Can either be a Document or an Entity."""

    def dump(self, data, many=False):
        results = []
        for res in ensure_list(data):
            if Document.SCHEMA in res.get('schemata'):
                res = DocumentSchema().dump(res)
            else:
                res = EntitySchema().dump(res)
            if not many:
                return res
            results.append(res.data)
        return results, []
