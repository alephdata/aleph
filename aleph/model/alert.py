from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.common import TimeStampedModel


class Alert(db.Model, TimeStampedModel):
    """A subscription to notifications on a given query."""

    __tablename__ = 'alert'

    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    query = db.Column(JSONB)
    max_id = db.Column(db.BigInteger)

    @property
    def label(self):
        return 'foo'

    def to_dict(self):
        return {
            'id': self.id,
            'label': self.label,
            'role_id': self.role_id,
            'query': self.query,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def by_id(cls, id, role_id=None):
        q = db.session.query(cls).filter_by(id=id)
        if role_id is not None:
            q = q.filter(cls.role_id == role_id)
        return q.first()

    @classmethod
    def all(cls, role_id=None):
        q = db.session.query(cls)
        if role_id is not None:
            q = q.filter(cls.role_id == role_id)
        return q

    @classmethod
    def create(cls, data, role_id):
        alert = cls()
        alert.role_id = role_id
        alert.query = data.get('query', {})
        db.session.add(alert)
        db.session.flush()
        return alert

    def delete(self):
        db.session.delete(self)

    def __repr__(self):
        return '<Alert(%r, %r)>' % (self.id, self.label)

    def __unicode__(self):
        return self.label
