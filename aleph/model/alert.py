from datetime import datetime
from normality import stringify

from aleph.core import db
from aleph.model.role import Role
from aleph.model.common import SoftDeleteModel


class Alert(db.Model, SoftDeleteModel):
    """A subscription to notifications on a given query."""
    __tablename__ = 'alert'

    id = db.Column(db.Integer, primary_key=True)
    custom_label = db.Column(db.Unicode, nullable=True)
    query_text = db.Column(db.Unicode, nullable=True)
    notified_at = db.Column(db.DateTime, nullable=True)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    role = db.relationship(Role, backref=db.backref('alerts', lazy='dynamic'))  # noqa

    @property
    def label(self):
        if self.custom_label is not None:
            return self.custom_label
        return self.query_text

    @property
    def norm_text(self):
        return stringify(self.query_text)

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
        if other.norm_text != self.norm_text:
            return False
        return True

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
        alert.query_text = stringify(data.get('query_text'))
        alert.custom_label = stringify(data.get('label'))
        alert.update()
        return alert

    @classmethod
    def dedupe(cls):
        alerts = cls.all()
        for left in alerts:
            for right in alerts:
                if left.id >= right.id:
                    continue
                if left.is_same(right):
                    left.delete()

    def __repr__(self):
        return '<Alert(%r, %r)>' % (self.id, self.label)
