import logging
from datetime import datetime

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
                              lazy='dynamic'))
    
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

    def __repr__(self):
        return '<Entity(%r, %r)>' % (self.id, self.label)

    def __unicode__(self):
        return self.label
