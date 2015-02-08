import logging
from datetime import datetime

from sqlalchemy import or_

from aleph.core import db, url_for
from aleph.model.user import User
from aleph.model.forms import ListForm

log = logging.getLogger(__name__)


list_user_table = db.Table('list_user', db.metadata,
    db.Column('list_id', db.Integer, db.ForeignKey('list.id')), # noqa
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')) # noqa
)


class List(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    label = db.Column(db.Unicode)
    public = db.Column(db.Boolean, default=False)

    creator_id = db.Column(db.Integer(), db.ForeignKey('user.id'),
                           nullable=True)
    creator = db.relationship(User)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    users = db.relationship(User, secondary=list_user_table,
                            backref='lists')

    def to_dict(self):
        return {
            'id': self.id,
            'api_url': url_for('lists.view', id=self.id),
            'entities_api_url': url_for('entities.index', list=self.id),
            'label': self.label,
            'public': self.public,
            'creator_id': self.creator_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def create(cls, data, user):
        lst = cls()
        lst.update(data, user)
        lst.creator = user
        db.session.add(lst)
        return lst

    def update(self, data, user):
        data = ListForm().deserialize(data)
        self.label = data.get('label')
        if data.get('public') is not None:
            self.public = data.get('public')
        users = set(data.get('users', []))
        if user is not None:
            users.add(user)
        self.users = list(users)

    def delete(self):
        # for entity in self.entities:
        #     entity.delete()
        db.session.delete(self)

    @classmethod
    def by_label(cls, label):
        q = db.session.query(cls).filter_by(label=label)
        return q.first()

    @classmethod
    def by_id(cls, id):
        q = db.session.query(cls).filter_by(id=id)
        return q.first()

    @classmethod
    def user_list_ids(cls, user=None, include_public=True):
        logged_in = user is not None and user.is_authenticated()
        q = db.session.query(cls.id)
        conds = []
        if include_public:
            conds.append(cls.public == True) # noqa
        if logged_in:
            conds.append(cls.users.any(User.id == user.id))
        if not len(conds):
            return []
        if not (logged_in and user.is_admin):
            q = q.filter(or_(*conds))
        return [c.id for c in q.all()]

    @classmethod
    def all_by_user(cls, user):
        q = db.session.query(cls)
        q = q.filter(cls.id.in_(cls.user_list_ids(user)))
        q = q.order_by(cls.id.desc())
        return q

    @property
    def terms(self):
        from aleph.model.entity import Entity
        from aleph.model.selector import Selector
        q = db.session.query(Selector.normalized)
        q = q.join(Entity, Entity.id == Selector.entity_id)
        q = q.filter(Entity.list_id == self.id)
        q = q.distinct()
        return set([r[0] for r in q])

    def __repr__(self):
        return '<List(%r, %r)>' % (self.id, self.label)

    def __unicode__(self):
        return self.label
