from flask import request
from marshmallow import post_dump
from marshmallow.fields import Nested, Integer, String, List
from marshmallow.fields import Dict, Boolean
from marshmallow.validate import Length

from aleph.core import url_for
from aleph.logic.collections import collection_url
from aleph.serializers.common import BaseSchema
from aleph.serializers.common import Category, Country, Language
from aleph.serializers.roles import RoleReferenceSchema
from aleph.model import Role


class CollectionSchema(BaseSchema):
    EXPAND = [
        ('creator', Role, 'creator', False),
    ]

    label = String(validate=Length(min=2, max=500), required=True)
    foreign_id = String()
    summary = String(allow_none=True)
    countries = List(Country())
    lanaguages = List(Language())
    managed = Boolean()
    category = Category(required=True)
    creator = Nested(RoleReferenceSchema, required=False, allow_none=True)
    count = Integer(dump_only=True)
    schemata = Dict(dump_only=True, default={})

    @post_dump
    def transient(self, data):
        id_ = str(data.get('id'))
        data['uri'] = url_for('collections_api.view', id=id_)
        data['ui'] = collection_url(id_)
        data['writeable'] = request.authz.can_write(id_)
        return data
