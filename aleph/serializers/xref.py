from marshmallow.fields import List, Integer
from aleph.serializers.expand import ExpandableSchema


class XrefSchema(ExpandableSchema):
    against_collection_ids = List(Integer())
