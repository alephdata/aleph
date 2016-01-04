import logging

from sqlalchemy import or_, func
from sqlalchemy.orm import aliased
from sqlalchemy.dialects.postgresql import JSON

from aleph.core import db, url_for
from aleph.model.forms import EntityForm, CATEGORIES
from aleph.model.watchlist import Watchlist
from aleph.model.common import db_compare
from aleph.model.common import TimeStampedModel

log = logging.getLogger(__name__)


class Entity(db.Model, TimeStampedModel):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Unicode)
    data = db.Column('data', JSON)
    category = db.Column(db.Enum(*CATEGORIES, name='entity_categories'),
                         nullable=False)
    watchlist_id = db.Column(db.Integer(), db.ForeignKey('watchlist.id'))
    watchlist = db.relationship(Watchlist, backref=db.backref('entities',
                                lazy='dynamic', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'api_url': url_for('entities.view', id=self.id),
            'category': self.category,
            'watchlist_id': self.watchlist_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    def delete(self):
        self.delete_selectors()
        db.session.delete(self)

    def delete_selectors(self):
        q = db.session.query(Selector)
        q = q.filter(Selector.entity_id == self.id)
        q.delete()

    @property
    def terms(self):
        return set([s.text for s in self.selectors])

    @classmethod
    def create(cls, data):
        ent = cls()
        ent.update(data)
        db.session.add(ent)
        return ent

    def update(self, data):
        data = EntityForm().deserialize(data)
        self.name = data.get('name')
        self.watchlist = data.get('watchlist')
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
    def by_name(cls, name, watchlist):
        q = db.session.query(cls)
        q = q.filter_by(watchlist=watchlist)
        q = q.filter(db_compare(cls.name, name))
        return q.first()

    @classmethod
    def by_id(cls, id):
        q = db.session.query(cls).filter_by(id=id)
        return q.first()

    @classmethod
    def by_lists(cls, watchlists, prefix=None):
        q = db.session.query(cls)
        q = q.filter(cls.watchlist_id.in_(watchlists))
        q = q.order_by(cls.name.asc())
        return q

    @classmethod
    def by_id_set(cls, ids, watchlist_id=None):
        if not len(ids):
            return {}
        q = db.session.query(cls)
        q = q.filter(cls.id.in_(ids))
        if watchlist_id is not None:
            q = q.filter(cls.watchlist_id == watchlist_id)
        entities = {}
        for ent in q:
            entities[ent.id] = ent
        return entities

    @classmethod
    def suggest_prefix(cls, prefix, watchlists, limit=10):
        if prefix is None or not len(prefix):
            return []
        prefix = prefix.strip()
        ent = aliased(Entity)
        sel = aliased(Selector)
        count = func.count(sel.id)
        q = db.session.query(ent.id, ent.name, ent.category, count)
        q = q.join(sel, ent.id == sel.entity_id)
        q = q.filter(ent.watchlist_id.in_(watchlists))
        q = q.filter(or_(sel.text.ilike('%s%%' % prefix),
                         sel.text.ilike('%% %s%%' % prefix)))
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
