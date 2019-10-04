from datetime import datetime
import logging

from normality import stringify
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model import Role, Collection
from aleph.model.common import SoftDeleteModel, ENTITY_ID_LEN


log = logging.getLogger(__name__)


class Mapping(db.Model, SoftDeleteModel):
    """A mapping to load entities from a table"""
    __tablename__ = 'mapping'

    id = db.Column(db.Integer, primary_key=True)
    query = db.Column('query', JSONB)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    role = db.relationship(Role, backref=db.backref('mappings', lazy='dynamic'))  # noqa

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref('mappings', lazy='dynamic'))  # noqa

    table_id = db.Column(db.String(ENTITY_ID_LEN), index=True)

    def update(self, query=None):
        self.updated_at = datetime.utcnow()
        if query:
            self.query = query
        db.session.add(self)
        db.session.commit()

    def delete(self, deleted_at=None):
        self.deleted_at = deleted_at or datetime.utcnow()
        db.session.add(self)
        db.session.commit()

    def to_dict(self):
        data = self.to_dict_dates()
        data.update({
            'id': stringify(self.id),
            'query': dict(self.query),
            'role_id': stringify(self.role_id),
            'collection_id': stringify(self.collection_id),
            'table_id': self.table_id,
        })
        return data

    @classmethod
    def by_id(cls, id, role_id=None):
        q = cls.all().filter_by(id=id)
        if role_id is not None:
            q = q.filter(cls.role_id == role_id)
        return q.first()

    @classmethod
    def by_role_id(cls, role_id):
        q = cls.all()
        q = q.filter(cls.role_id == role_id)
        q = q.order_by(cls.created_at.desc())
        q = q.order_by(cls.id.desc())
        return q

    @classmethod
    def by_collection(cls, collection_id):
        return cls.all().filter(Mapping.collection_id == collection_id)

    @classmethod
    def by_table(cls, table_id, q=None):
        if q is None:
            q = cls.all()
        return q.filter(Mapping.table_id == table_id)

    @classmethod
    def create(cls, query, table_id, collection, role_id):
        mapping = cls()
        mapping.role_id = role_id
        mapping.query = query
        mapping.collection_id = collection.id
        mapping.table_id = table_id
        mapping.update()
        return mapping

    def __repr__(self):
        return '<Mapping(%r, %r, %r)>' % (self.id, self.table_id, self.collection_id)  # noqa
