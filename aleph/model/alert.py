from datetime import datetime
from normality import stringify

from aleph.core import db
from aleph.model.entity import Entity
from aleph.model.common import SoftDeleteModel


class Alert(db.Model, SoftDeleteModel):
    """A subscription to notifications on a given query."""
    __tablename__ = 'alert'

    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    custom_label = db.Column(db.Unicode, nullable=True)
    query_text = db.Column(db.Unicode, nullable=True)
    entity_id = db.Column(db.String(32), db.ForeignKey('entity.id'), nullable=True)  # noqa
    entity = db.relationship(Entity, backref=db.backref('alerts', lazy='dynamic'))  # noqa
    notified_at = db.Column(db.DateTime, nullable=True)

    @property
    def label(self):
        if self.custom_label is not None:
            return self.custom_label
        if self.entity:
            return self.entity.name
        return self.query_text

    def delete(self, deleted_at=None):
        self.deleted_at = deleted_at or datetime.utcnow()
        db.session.add(self)
        db.session.flush()

    def update(self):
        self.notified_at = datetime.utcnow()
        db.session.add(self)
        db.session.flush()

    def is_same(self, other):
        if other.role_id == self.role_id:
            if other.entity_id == self.entity_id:
                if other.query_text == self.query_text:
                    return True
        return False

    @classmethod
    def by_id(cls, id, role=None):
        q = cls.all().filter_by(id=id)
        if role is not None:
            q = q.filter(cls.role_id == role.id)
        return q.first()

    @classmethod
    def by_role(cls, role):
        return cls.all().filter(cls.role_id == role.id)

    @classmethod
    def create(cls, data, role):
        alert = cls()
        alert.role_id = role.id
        alert.query_text = stringify(data.get('query_text'))
        alert.entity_id = stringify(data.get('entity_id'))
        alert.custom_label = stringify(data.get('label'))
        alert.update()
        return alert

    @classmethod
    def dedupe(cls, entity_id):
        alerts = cls.all().filter_by(entity_id=entity_id).all()
        for left in alerts:
            for right in alerts:
                if left.id >= right.id:
                    continue
                if left.is_same(right):
                    left.delete()

    def __repr__(self):
        return '<Alert(%r, %r)>' % (self.id, self.label)
