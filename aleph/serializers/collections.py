from flask import request
from banal import is_mapping
from marshmallow import post_dump, pre_dump, pre_load
from marshmallow.fields import Nested, Integer, String, List
from marshmallow.fields import Dict, Boolean
from marshmallow.validate import Length

from aleph.core import url_for
from aleph.logic.collections import collection_url
from aleph.serializers.common import BaseSchema, flatten_id
from aleph.serializers.common import Category, Country, Language
from aleph.serializers.roles import RoleReferenceSchema
from aleph.model import Role


class CollectionSchema(BaseSchema):
    EXPAND = [
        ('creator', Role, 'creator', RoleReferenceSchema, False),
    ]

    label = String(validate=Length(min=2, max=500), required=True)
    foreign_id = String()
    summary = String(allow_none=True)
    countries = List(Country())
    lanaguages = List(Language())
    managed = Boolean()
    secret = Boolean(dump_only=True)
    category = Category(required=True)
    creator_id = String(allow_none=True)
    creator = Nested(RoleReferenceSchema(), dump_only=True)
    count = Integer(dump_only=True)
    schemata = Dict(dump_only=True, default={})

    @pre_load()
    def flatten_collection(self, data):
        flatten_id(data, 'creator_id', 'creator')

    @pre_dump()
    def visibility(self, data):
        if not is_mapping(data):
            return
        roles = data.get('roles', [])
        public = Role.public_roles()
        data['secret'] = public.intersection(roles) < 0

    @post_dump
    def transient(self, data):
        pk = str(data.get('id'))
        data['links'] = {
            'self': url_for('collections_api.view', id=pk),
            'ui': collection_url(pk)
        }
        data['writeable'] = request.authz.can_write(pk)
        return data
