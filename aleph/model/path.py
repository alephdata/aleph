import logging
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from aleph.core import db
from aleph.model.common import IdModel
from aleph.model.entity import collection_entity_table

log = logging.getLogger(__name__)


class Path(db.Model, IdModel):
    entity_id = db.Column(db.Unicode(255), index=True)
    data = db.Column(JSONB)
    length = db.Column(db.Integer())
    labels = db.Column(ARRAY(db.Unicode()))
    types = db.Column(ARRAY(db.Unicode()))
    end_collection_id = db.Column(db.Integer(), db.ForeignKey('collection.id'), index=True)  # noqa

    @classmethod
    def from_data(cls, entity, nodes, edges, end_collection_id):
        obj = cls()
        obj.entity_id = entity.id
        obj.end_collection_id = end_collection_id
        obj.length = len(edges)
        obj.labels = list(set([n['$label'] for n in nodes]))
        obj.types = list(set([e['$type'] for e in edges]))
        obj.data = {
            'nodes': nodes,
            'edges': edges
        }
        db.session.add(obj)
        return obj

    def to_dict(self):
        return self.data

    @classmethod
    def delete_by_entity(cls, entity_id):
        q = db.session.query(cls)
        q = q.filter(cls.entity_id == entity_id)
        q.delete()

    @classmethod
    def find(cls, collection, entity_id=None):
        q = db.session.query(cls)
        if entity_id is not None:
            q = q.filter(cls.entity_id == entity_id)
        else:
            cet = collection_entity_table.alias()
            q = q.join(cet, cet.c.entity_id == cls.entity_id)
            q = q.filter(cet.c.collection_id == collection.id)
        print q
        return q

    def __repr__(self):
        return '<Path(%r, %r, %r)>' % (self.id, self.entity_id, self.length)
