import logging

from aleph.core import db, url_for
from aleph.model.user import User
from aleph.model.forms import ListForm
from aleph.model.common import TimeStampedModel

log = logging.getLogger(__name__)


list_user_table = db.Table('list_user', db.metadata,
    db.Column('list_id', db.Integer, db.ForeignKey('list.id')), # noqa
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')) # noqa
)


class List(db.Model, TimeStampedModel):
    id = db.Column(db.Integer(), primary_key=True)
    label = db.Column(db.Unicode)
    foreign_id = db.Column(db.Unicode, unique=True, nullable=False)
    public = db.Column(db.Boolean, default=False)

    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'),
                           nullable=True)
    creator = db.relationship(User)

    users = db.relationship(User, secondary=list_user_table,
                            backref='lists')

    def to_dict(self):
        return {
            'id': self.id,
            'api_url': url_for('lists.view', id=self.id),
            'entities_api_url': url_for('entities.index', list=self.id),
            'label': self.label,
            'foreign_id': self.foreign_id,
            'public': self.public,
            'creator_id': self.creator_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

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

    def delete_entities(self):
        for entity in self.entities:
            entity.delete()

    @classmethod
    def by_foreign_id(cls, foreign_id, data):
        q = db.session.query(cls)
        q = q.filter(cls.foreign_id == foreign_id)
        lst = q.first()
        if lst is None:
            lst = cls.create(data, None)
            lst.foreign_id = foreign_id
        return lst

    @classmethod
    def create(cls, data, user):
        lst = cls()
        lst.update(data, user)
        lst.creator = user
        db.session.add(lst)
        return lst

    @classmethod
    def by_id(cls, id):
        q = db.session.query(cls).filter_by(id=id)
        return q.first()

    @classmethod
    def all(cls, list_ids=None):
        q = db.session.query(cls)
        if list_ids is not None:
            q = q.filter(cls.id.in_(list_ids))
        q = q.order_by(cls.id.desc())
        return q

    @property
    def terms(self):
        from aleph.model.entity import Entity, Selector
        q = db.session.query(Selector.text)
        q = q.join(Entity, Entity.id == Selector.entity_id)
        q = q.filter(Entity.list_id == self.id)
        q = q.distinct()
        return set([r[0] for r in q])

    def __repr__(self):
        return '<List(%r, %r)>' % (self.id, self.label)

    def __unicode__(self):
        return self.label
