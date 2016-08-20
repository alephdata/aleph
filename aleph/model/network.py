import logging
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.role import Role
from aleph.model.collection import Collection
from aleph.model.common import IdModel, DatedModel
from aleph.model.validation import validate

log = logging.getLogger(__name__)


class Network(db.Model, IdModel, DatedModel):
    _schema = 'network.json#'

    label = db.Column(db.Unicode(255))
    data = db.Column(JSONB)
    creator_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)
    creator = db.relationship(Role)
    collection_id = db.Column(db.Integer(), db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref('networks', cascade='all, delete-orphan'))  # noqa

    @classmethod
    def create(cls, data, collection, role):
        obj = cls()
        obj.creator = role
        obj.collection = collection
        obj.update(data)
        return obj

    @classmethod
    def by_id_collection(cls, id, collection):
        q = cls.all()
        q = q.filter(cls.id == id)
        q = q.filter(cls.collection_id == collection.id)
        return q.first()

    def update(self, data):
        validate(data, self._schema)
        self.label = data.pop('label')
        self.data = {
            'nodes': data.pop('nodes', []),
            'edges': data.pop('edges', []),
            'view': data.pop('view', {})
        }
        db.session.add(self)

    def to_dict(self):
        data = super(Network, self).to_dict()
        data['label'] = self.label
        data['collection_id'] = self.collection_id
        data['nodes'] = self.data.get('nodes')
        data['edges'] = self.data.get('edges')
        data['view'] = self.data.get('view')
        return data

    def __repr__(self):
        return '<Network(%r, %r)>' % (self.id, self.label)
