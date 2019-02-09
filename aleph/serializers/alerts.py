from marshmallow import post_dump
from marshmallow.fields import String, DateTime

from aleph.core import url_for
from aleph.serializers.common import BaseSchema


class AlertSchema(BaseSchema):
    query = String()
    normalized = String(dump_only=True)
    notified_at = DateTime(dump_only=True)

    @post_dump
    def hypermedia(self, data):
        data['links'] = {
            'self': url_for('alerts_api.view', id=data.get('id'))
        }
        data['writeable'] = True
        return data
