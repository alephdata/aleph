from datetime import datetime
from werkzeug.datastructures import MultiDict
from sqlalchemy import func

from aleph.core import db
from aleph.model.entity import Entity
from aleph.model.validation import validate
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
        validate(data, 'alert.json#')
        alert = cls()
        alert.role_id = role.id
        alert.query_text = data.get('query_text')
        if alert.query_text is not None:
            alert.query_text = alert.query_text.strip()
            alert.query_text = alert.query_text or None
        alert.entity_id = data.get('entity_id') or None
        alert.custom_label = data.get('label')
        alert.update()
        return alert

    @classmethod
    def exists(cls, query, role):
        q = cls.all_ids().filter(cls.role_id == role.id)
        query_text = query.get('q')
        if query_text is not None:
            query_text = query_text.strip()
            if not len(query_text):
                query_text = None
        q = q.filter(cls.query_text == query_text)
        entities = query.getlist('entity')
        if len(entities) == 1:
            q = q.filter(cls.entity_id == entities[0])
        else:
            q = q.filter(cls.entity_id == None)  # noqa
        q = q.limit(1)
        return q.scalar()

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

    def to_query(self):
        return MultiDict({
            'q': self.query_text or '',
            'entity': self.entity_id
        })

    def to_dict(self):
        return {
            'id': self.id,
            'label': self.label,
            'role_id': self.role_id,
            'query_text': self.query_text,
            'entity_id': self.entity_id,
            'created_at': self.created_at,
            'notified_at': self.notified_at,
            'updated_at': self.updated_at
        }
