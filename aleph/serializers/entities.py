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


class ShallowCombinedSchema(BaseSchema):
    collection_id = String()

    # Joint entity/document attributes
    collection = Nested(CollectionSchema())
    schema = SchemaName()
    schemata = List(SchemaName())
    names = List(String())
    addresses = List(String())
    phones = List(String())
    emails = List(String())
    identifiers = List(String())
    countries = List(Country())
    dates = List(PartialDate())
    bulk = Boolean()

    # Entity attributes
    foreign_ids = List(String())
    foreign_id = String()
    name = String()
    entities = List(String())
    properties = Dict()

    # Document attributes
    status = String()
    content_hash = String()
    uploader_id = String()
    uploader = Nested(RoleReferenceSchema())
    error_message = String()
    title = String()
    summary = String()
    languages = List(Language())
    keywords = List(String())
    date = PartialDate()
    authored_at = PartialDate()
    modified_at = PartialDate()
    published_at = PartialDate()
    retrieved_at = PartialDate()
    file_name = String()
    file_size = Integer()
    author = String()
    generator = String()
    mime_type = String()
    extension = String()
    encoding = String()
    source_url = String()
    pdf_version = String()
    columns = List(String())
    children = Integer()

    # TODO: is this a separate endpoint?
    text = String()
    html = String()

    @post_dump
    def hypermedia(self, data):
        collection_id = data.get('collection_id')
        is_document = Document.SCHEMA in data.get('schemas', [])
        if is_document:
            data['uri'] = url_for('documents_api.view', document_id=data.get('id'))  # noqa
            data['ui'] = document_url(data.get('id'))
        else:
            data['uri'] = url_for('entities_api.view', id=data.get('id'))
            data['ui'] = entity_url(data.get('id'))

        if data.get('bulk'):
            data['writeable'] = False
        else:
            data['writeable'] = request.authz.can_write(collection_id)
        return data


class CombinedSchema(ShallowCombinedSchema):
    EXPAND = [
        ('collection_id', Collection, 'collection', False),
        ('entities', Entity, 'related', True),
        ('uploader_id', Document, 'uploader', False),
        ('parent', Document, 'parent', False),
    ]
    related = List(Nested(ShallowCombinedSchema()))
    parent = Nested(ShallowCombinedSchema())


class EntityUpdateSchema(Schema):
    name = String(allow_none=True)
    schema = SchemaName(required=True)
    properties = Dict()


class EntityCreateSchema(EntityUpdateSchema):
    collection_id = String(required=True)
    foreign_ids = List(String())


class DocumentParentSchema(Schema):
    id = String(allow_none=True)
    foreign_id = String(allow_none=True)


class DocumentUpdateSchema(Schema):
    countries = List(Country())
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
    author = String(allow_none=True)
    generator = String(allow_none=True)
    mime_type = String(allow_none=True)
    source_url = String(allow_none=True)
    parent = Nested(DocumentParentSchema())
