from flask import request
from banal import ensure_list
from followthemoney import model
from marshmallow import Schema, post_dump, pre_load
from marshmallow.fields import Nested, Integer, String, List
from marshmallow.fields import Dict, Boolean
from marshmallow.validate import Length

from aleph.core import url_for
from aleph.logic.entities import entity_url
from aleph.logic.documents import document_url
from aleph.serializers.common import BaseSchema, flatten_id
from aleph.serializers.common import SchemaName, PartialDate
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
    headers = Dict()
    children = Integer()

    # TODO: is this a separate endpoint?
    text = String()
    html = String()

    def document_links(self, data, pk, schemata):
        links = {
            'self': url_for('documents_api.view', document_id=pk),
            'pivot': url_for('entities_api.pivot', id=pk),
            'ui': document_url(pk)
        }
        if data.get('content_hash'):
            links['file'] = url_for('documents_api.file', document_id=pk)
        if schemata.intersection([Document.SCHEMA_PDF]):
            links['pdf'] = url_for('documents_api.pdf', document_id=pk)
        if schemata.intersection([Document.SCHEMA_PDF, Document.SCHEMA_TABLE]):
            links['records'] = url_for('documents_api.records', document_id=pk)
        if schemata.intersection([Document.SCHEMA_FOLDER]):
            query = (('filter:parent.id', pk),)
            links['children'] = url_for('documents_api.index', _query=query)
        return links

    def entity_links(self, data, pk, schemata):
        return {
            'self': url_for('entities_api.view', id=pk),
            # 'similar': url_for('entities_api.similar', id=pk),
            # 'documents': url_for('entities_api.documents', id=pk),
            'references': url_for('entities_api.references', id=pk),
            'pivot': url_for('entities_api.pivot', id=pk),
            'ui': entity_url(pk)
        }

    @post_dump
    def hypermedia(self, data):
        pk = str(data.get('id'))
        collection = data.get('collection', {})
        collection_id = collection.get('id')
        collection_id = collection_id or data.get('collection_id')
        schemata = set(data.get('schemata', []))
        if Document.SCHEMA in schemata:
            data['links'] = self.document_links(data, pk, schemata)
        else:
            data['links'] = self.entity_links(data, pk, schemata)

        if data.get('bulk'):
            data['writeable'] = False
        else:
            data['writeable'] = request.authz.can_write(collection_id)
        return data


class CombinedSchema(ShallowCombinedSchema):
    EXPAND = [
        ('collection_id', Collection, 'collection', CollectionSchema, False),
        ('entities', Entity, '_related', ShallowCombinedSchema, True),
        ('uploader_id', Document, 'uploader', ShallowCombinedSchema, False),
        ('parent', Document, 'parent', ShallowCombinedSchema, False),
    ]
    related = List(Nested(ShallowCombinedSchema()))
    parent = Nested(ShallowCombinedSchema())

    @post_dump(pass_many=True)
    def expand(self, objs, many=False):
        super(ShallowCombinedSchema, self).expand(objs, many=many)
        for obj in ensure_list(objs):
            # This will replace entity IDs for related entities with the
            # actual entity objects which have been retrieved because they
            # were all listed in the 'entities' reverse index.
            related = obj.pop('_related', [])
            schema = model.get(obj.get('schema'))
            if schema is None or not len(related):
                continue
            related = {r.get('id'): r for r in related}
            properties = obj.get('properties')
            for name, prop in schema.properties.items():
                if name not in properties or prop.type_name != 'entity':
                    continue
                values = ensure_list(properties.get(name))
                values = [related.get(v) for v in values if v in related]
                properties[name] = values


class EntityUpdateSchema(Schema):
    name = String(allow_none=True)
    schema = SchemaName(required=True)
    properties = Dict()


class EntityCreateSchema(EntityUpdateSchema):
    collection_id = String(required=True)
    foreign_ids = List(String())

    @pre_load()
    def flatten_collection(self, data):
        flatten_id(data, 'collection_id', 'collection')


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


class DocumentCreateSchema(DocumentUpdateSchema):
    parent = Nested(DocumentParentSchema())
