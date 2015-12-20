import logging

from sqlalchemy import or_
from sqlalchemy.orm import aliased
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.dialects.postgresql import JSON

from aleph.core import db, url_for
from aleph.model.user import User
from aleph.model.forms import EntityForm, CATEGORIES
from aleph.model.common import make_textid, db_compare
from aleph.model.common import TimeStampedModel

log = logging.getLogger(__name__)


class Entity(db.Model, TimeStampedModel):
    id = db.Column(db.Unicode(254), primary_key=True, default=make_textid)
    name = db.Column(db.Unicode)

    category = db.Column(db.Enum(*CATEGORIES, name='entity_categories'),
                         nullable=False)

    creator_id = db.Column(db.Unicode(254), db.ForeignKey('user.id'))
    creator = db.relationship(User, backref=db.backref('entities',
                              lazy='dynamic', cascade='all, delete-orphan'))

    list_id = db.Column(db.Integer(), db.ForeignKey('list.id'))
    list = db.relationship('List', backref=db.backref('entities',
                           lazy='dynamic', cascade='all, delete-orphan'))

    _data = db.Column('data', JSON)

    @hybrid_property
    def data(self):
        return self._data

    @data.setter
    def data(self, data):
        self._data = data

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'api_url': url_for('entities.view', id=self.id),
            'category': self.category,
            'creator_id': self.creator_id,
            'list_id': self.list_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    def delete(self):
        db.session.delete(self)

    @classmethod
    def create(cls, data, user):
        ent = cls()
        ent.update(data)
        ent.creator = user
        db.session.add(ent)
        return ent

    def update(self, data):
        data = EntityForm().deserialize(data)
        self.name = data.get('name')
        self.list = data.get('list')
        self.category = data.get('category')

    @classmethod
    def by_normalized_name(cls, name, lst):
        q = db.session.query(cls)
        q = q.filter_by(list=lst)
        q = q.filter(db_compare(cls.name, name))
        return q.first()

    @classmethod
    def by_id(cls, id):
        q = db.session.query(cls).filter_by(id=id)
        return q.first()

    @classmethod
    def by_lists(cls, lists, prefix=None):
        q = db.session.query(cls)
        q = q.filter(cls.list_id.in_(lists))
        q = q.order_by(cls.name.asc())
        return q

    @classmethod
    def by_id_set(cls, ids):
        if not len(ids):
            return {}
        q = db.session.query(cls)
        q = q.filter(cls.id.in_(ids))
        entities = {}
        for ent in q:
            entities[ent.id] = ent
        return entities

    @classmethod
    def suggest_prefix(cls, prefix, lists, limit=10):
        if prefix is None or not len(prefix):
            return []

        ent = aliased(Entity)
        q = db.session.query(ent.id, ent.name, ent.category)
        q.filter(or_(ent.name.like('%s%%' % prefix),
                     ent.name.like('%% %s%%' % prefix)))
        q = q.filter(ent.list_id.in_(lists))
        q = q.order_by(ent.name.asc())
        q = q.limit(limit)
        q = q.distinct()
        suggestions = []
        for entity_id, name, category in q.all():
            suggestions.append({
                'id': entity_id,
                'name': name,
                'category': category
            })
        return suggestions

    def __repr__(self):
        return '<Entity(%r, %r)>' % (self.id, self.name)

    def __unicode__(self):
        return self.name
