from datetime import datetime
from itertools import permutations
from normality import stringify, normalize

from aleph.core import db
from aleph.model.role import Role
from aleph.model.common import SoftDeleteModel


class Alert(db.Model, SoftDeleteModel):
    """A subscription to notifications on a given query."""
    __tablename__ = 'alert'

    id = db.Column(db.Integer, primary_key=True)
    query = db.Column(db.Unicode, nullable=True)
    notified_at = db.Column(db.DateTime, nullable=True)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    role = db.relationship(Role, backref=db.backref('alerts', lazy='dynamic'))  # noqa

    @property
    def normalized(self):
        return normalize(self.query)

    def delete(self, deleted_at=None):
        self.deleted_at = deleted_at or datetime.utcnow()
        db.session.add(self)
        db.session.flush()

    def update(self):
        self.notified_at = datetime.utcnow()
        db.session.add(self)
        db.session.flush()

    def is_same(self, other):
        if other.role_id != self.role_id:
            return False
        if other.normalized != self.normalized:
            return False
        return True

    def to_dict(self):
        return {
            'id': stringify(self.id),
            'query': self.query,
            'normalized': self.normalized,
            'role_id': stringify(self.role_id),
            'notified_at': self.notified_at,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'deleted_at': self.deleted_at
        }

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
    def create(cls, data, role_id):
        alert = cls()
        alert.role_id = role_id
        alert.query = stringify(data.get('query'))
        alert.update()
        return alert

    @classmethod
    def dedupe(cls):
        alerts = cls.all()
        for (left, right) in permutations(alerts, 2):
            if left.id >= right.id:
                continue
            if left.is_same(right):
                left.delete()

    def __repr__(self):
        return '<Alert(%r, %r)>' % (self.id, self.query)
