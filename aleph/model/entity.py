import logging
from datetime import datetime

from sqlalchemy.orm import aliased

from aleph.core import db
from aleph.model.user import User
from aleph.model.selector import Selector
from aleph.model.util import make_textid, db_compare

log = logging.getLogger(__name__)


class Entity(db.Model):
    PERSON = 'Person'
    COMPANY = 'Company'
    ORGANIZATION = 'Organization'
    OTHER = 'Other'
    CATEGORIES = [PERSON, COMPANY, ORGANIZATION, OTHER]

    id = db.Column(db.Unicode(50), primary_key=True, default=make_textid)
    label = db.Column(db.Unicode)
    category = db.Column(db.Enum(*CATEGORIES, name='entity_categories'),
                         nullable=False)

    creator_id = db.Column(db.Integer(), db.ForeignKey('user.id'))
    creator = db.relationship(User, backref=db.backref('entities',
                              lazy='dynamic', cascade='all, delete-orphan'))
    
    list_id = db.Column(db.Integer(), db.ForeignKey('list.id'))
    list = db.relationship('List', backref=db.backref('entities',
                                                      lazy='dynamic'))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'label': self.label,
            'category': self.category,
            'creator_id': self.creator_id,
            # 'selectors': [s.text for s in self.selectors],
            'list_id': self.list_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    def has_selector(self, text):
        normalized = Selector.normalize(text)
        for selector in self.selectors:
            if selector.normalized == normalized:
                return True
        return False

    def delete(self):
        self.selectors.delete()
        db.session.delete(self)

    @classmethod
    def by_normalized_label(cls, label, lst):
        q = db.session.query(cls)
        q = q.filter_by(list=lst)
        q = q.filter(db_compare(cls.label, label))
        return q.first()

    @classmethod
    def by_id(cls, id):
        q = db.session.query(cls).filter_by(id=id)
        return q.first()

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
        from aleph.model import EntityTag
        ent = aliased(Entity)
        sel = aliased(Selector)
        tag = aliased(EntityTag)
        prefix = Selector.normalize(prefix)
        if not len(prefix):
            return []
        prefix = '%s%%' % prefix
        q = db.session.query(ent.id, ent.label, ent.category)
        q = q.join(sel, ent.id == sel.entity_id)
        q = q.join(tag, ent.id == tag.entity_id)
        q = q.filter(ent.list_id.in_(lists))
        q = q.filter(sel.normalized.like(prefix))
        q = q.limit(limit)
        q = q.distinct()
        suggestions = []
        for entity_id, label, category in q.all():
            suggestions.append({
                'id': entity_id,
                'label': label,
                'category': category
            })
        return suggestions

    def __repr__(self):
        return '<Entity(%r, %r)>' % (self.id, self.label)

    def __unicode__(self):
        return self.label
