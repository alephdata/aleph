from flask import request
from banal import is_mapping
from marshmallow import post_dump, pre_dump, pre_load
from marshmallow.fields import Nested, Integer, String, List
from marshmallow.fields import Dict, Boolean, Raw

from aleph.serializers.common import BaseSchema


class NotificationSchema(BaseSchema):
    event = Dict()
    params = Raw()

    @post_dump
    def transient(self, data):
        for param, type_ in data.get('event', {}).get('params', {}).items():
            data['event']['params'][param] = type_.__name__
        return data
