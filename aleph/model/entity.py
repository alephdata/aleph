import logging
from datetime import datetime

from sqlalchemy import or_, func
from sqlalchemy.orm import aliased
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.constants import ENTITY_CATEGORIES
from aleph.model.collection import Collection
from aleph.model.validation import validate
from aleph.model.common import db_compare
from aleph.model.common import SoftDeleteModel

log = logging.getLogger(__name__)


class Entity(db.Model, SoftDeleteModel):
    id = db.Column(db.Integer, primary_key=True)
    foreign_id = db.Column(db.Unicode, unique=False, nullable=True)
    name = db.Column(db.Unicode)
    data = db.Column('data', JSONB)
    category = db.Column(db.Enum(*ENTITY_CATEGORIES, name='entity_categories'),
                         nullable=False)
    collection_id = db.Column(db.Integer(), db.ForeignKey('collection.id'))
    collection = db.relationship(Collection, backref=db.backref('entities', lazy='dynamic', cascade='all, delete-orphan'))  # noqa

    def delete(self):
        from aleph.model import Reference
        # TODO: make this more consistent in terms of soft vs hard deletes
        q = db.session.query(Reference)
        q = q.filter(Reference.entity_id == self.id)
        q.delete(synchronize_session='fetch')
        q = db.session.query(Selector)
        q = q.filter(Selector.entity_id == self.id)
        q.delete(synchronize_session='fetch')
        self.deleted_at = datetime.utcnow()

    @property
    def terms(self):
        return set([s.text for s in self.selectors])

    def update(self, data):
        validate(data, 'entity.json#')
        self.name = data.get('name')
        self.category = data.get('category')
        self.data = data.get('data')
        db.session.add(self)
        db.session.flush()
        selectors = set(data.get('selectors', []))
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
    def create(cls, data):
        ent = cls()
        ent.update(data)
        db.session.add(ent)
        return ent

    @classmethod
    def by_foreign_id(cls, foreign_id, collection, data):
        q = cls.all()
        q = q.filter_by(collection=collection)
        q = q.filter_by(foreign_id=foreign_id)
        ent = q.first()
        if ent is None:
            ent = cls.create(data)
            ent.foreign_id = foreign_id
            ent.collection = collection
        else:
            ent.update(data)
        db.session.flush()
        return ent

    @classmethod
    def by_name(cls, name, collection):
        q = cls.all()
        q = q.filter_by(collection=collection)
        q = q.filter(db_compare(cls.name, name))
        return q.first()

    @classmethod
    def by_lists(cls, collections, prefix=None):
        q = cls.all()
        q = q.filter(cls.collection_id.in_(collections))
        q = q.order_by(cls.name.asc())
        return q

    @classmethod
    def by_id_set(cls, ids, collection_id=None):
        if not len(ids):
            return {}
        q = cls.all()
        q = q.filter(cls.id.in_(ids))
        if collection_id is not None:
            q = q.filter(cls.collection_id == collection_id)
        entities = {}
        for ent in q:
            entities[ent.id] = ent
        return entities

    @classmethod
    def suggest_prefix(cls, prefix, collections, limit=10):
        if prefix is None or not len(prefix):
            return []
        prefix = prefix.strip()
        ent = aliased(Entity)
        sel = aliased(Selector)
        count = func.count(sel.id)
        q = db.session.query(ent.id, ent.name, ent.category, count)
        q = q.join(sel, ent.id == sel.entity_id)
        q = q.filter(ent.deleted_at == None)  # noqa
        q = q.filter(ent.collection_id.in_(collections))
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

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'foreign_id': self.foreign_id,
            # 'api_url': url_for('entities_api.view', id=self.id),
            'category': self.category,
            'collection_id': self.collection_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }


class Selector(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Unicode, index=True)

    entity_id = db.Column(db.Integer, db.ForeignKey('entity.id'))
    entity = db.relationship(Entity, backref=db.backref('selectors', lazy='dynamic', cascade='all, delete-orphan')) # noqa

    def __repr__(self):
        return '<Selector(%r, %r)>' % (self.entity_id, self.text)

    def __unicode__(self):
        return self.text
