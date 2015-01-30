import logging
from datetime import datetime

from sqlalchemy import or_

from aleph.core import db
from aleph.model.user import User
from aleph.model.util import make_textid

log = logging.getLogger(__name__)


list_user_table = db.Table('list_user', db.metadata,
    db.Column('list_id', db.Integer, db.ForeignKey('list.id')), # noqa
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')) # noqa
)


class List(db.Model):
    id = db.Column(db.Integer(), primary_key=True, default=make_textid)
    label = db.Column(db.Unicode)
    public = db.Column(db.Boolean, default=False)

    creator_id = db.Column(db.Integer(), db.ForeignKey('user.id'))
    creator = db.relationship(User)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    users = db.relationship(User, secondary=list_user_table,
                            backref='lists')

    def to_dict(self):
        return {
            'id': self.id,
            'label': self.label,
            'public': self.public,
            'creator_id': self.creator_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

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

    def __repr__(self):
        return '<List(%r, %r)>' % (self.id, self.label)

    def __unicode__(self):
        return self.label
