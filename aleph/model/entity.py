import logging

from sqlalchemy import or_, func
from sqlalchemy.orm import aliased
from sqlalchemy.dialects.postgresql import JSON

from aleph.core import db, url_for
from aleph.model.forms import EntityForm, CATEGORIES
from aleph.model.common import db_compare
from aleph.model.common import TimeStampedModel

log = logging.getLogger(__name__)


class Entity(db.Model, TimeStampedModel):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Unicode)
    data = db.Column('data', JSON)
    category = db.Column(db.Enum(*CATEGORIES, name='entity_categories'),
                         nullable=False)
    list_id = db.Column(db.Integer(), db.ForeignKey('list.id'))
    list = db.relationship('List', backref=db.backref('entities',
                           lazy='dynamic', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'api_url': url_for('entities.view', id=self.id),
            'category': self.category,
            'list_id': self.list_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    def delete(self):
        db.session.delete(self)

    @classmethod
    def create(cls, data):
        ent = cls()
        ent.update(data)
        db.session.add(ent)
        return ent

    def update(self, data):
        data = EntityForm().deserialize(data)
        self.name = data.get('name')
        self.list = data.get('list')
        self.category = data.get('category')
        selectors = set(data.get('selectors', []))
        self.data = data.get('data')

        selectors.add(self.name)
        existing = list(self.selectors)
        for sel in list(existing):
            if sel.text in selectors:
                selectors.remove(sel.text)
                existing.remove(sel)
        for sel in existing:
            db.session.delete(sel)
        for text in selectors:
            sel = Selector()
            sel.entity = self
            sel.text = text
            db.session.add(sel)

    @classmethod
    def by_name(cls, name, lst):
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
        prefix = prefix.strip()
        ent = aliased(Entity)
        sel = aliased(Selector)
        count = func.count(sel.id)
        q = db.session.query(ent.id, ent.name, ent.category, count)
        q = q.join(sel, ent.id == sel.entity_id)
        q = q.filter(ent.list_id.in_(lists))
        q = q.filter(or_(sel.text.ilike('%s%%' % prefix),
                         sel.text.ilike('%% %s%%' % prefix)))
        q = cls.apply_filter(q, sel.normalized, prefix)
        q = q.group_by(ent.id, ent.name, ent.category)
        q = q.order_by(count.desc())
        q = q.limit(limit)
        suggestions = []
        for entity_id, name, category, count in q.all():
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


class Selector(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Unicode, index=True)

    entity_id = db.Column(db.Integer, db.ForeignKey('entity.id'))
    entity = db.relationship(Entity, backref=db.backref('selectors',
                             lazy='dynamic',
                             cascade='all, delete-orphan')) # noqa

    def __repr__(self):
        return '<Selector(%r, %r)>' % (self.entity_id, self.text)

    def __unicode__(self):
        return self.text
