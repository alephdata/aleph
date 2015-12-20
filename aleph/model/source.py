import logging

from aleph.core import db, url_for
from aleph.model.common import TimeStampedModel, make_token
from aleph.model.user import User
from aleph.model.forms import SourceEditForm, SourceCreateForm

log = logging.getLogger(__name__)


source_user_table = db.Table('source_user', db.metadata,
    db.Column('source_id', db.Integer, db.ForeignKey('source.id')), # noqa
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')) # noqa
)


class Source(db.Model, TimeStampedModel):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.Unicode, unique=True, nullable=False)
    label = db.Column(db.Unicode, nullable=True)
    public = db.Column(db.Boolean, default=True)

    users = db.relationship(User, secondary=source_user_table,
                            backref='sources')

    def __repr__(self):
        return '<Source(%r)>' % self.key

    def __unicode__(self):
        return self.label

    def update(self, data, user):
        data = SourceEditForm().deserialize(data)
        self.update_data(data, user)

    def update_data(self, data, user):
        self.label = data.get('label')
        self.public = data.get('public')
        users = set(data.get('users', []))
        if user is not None:
            users.add(user)
        self.users = list(users)

    def to_dict(self):
        return {
            'api_url': url_for('sources.view', id=self.id),
            'id': self.id,
            'key': self.key,
            'label': self.label,
            'public': self.public,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def by_id(cls, id):
        return db.session.query(cls).filter_by(id=id).first()

    @classmethod
    def by_key(cls, key):
        return db.session.query(cls).filter_by(key=key).first()

    @classmethod
    def all(cls, ids=None):
        q = db.session.query(cls)
        if ids is not None:
            q = q.filter(cls.id.in_(ids))
        return q

    @classmethod
    def create(cls, data, user=None):
        if data.get('key') is not None:
            src = Source.by_key(data.get('key'))
            if src is not None:
                return src
        src = cls()
        data = SourceCreateForm().deserialize(data)
        src.key = data.get('key', make_token())
        src.update_data(data, user)
        db.session.add(src)
        return src

    @classmethod
    def delete(cls, id):
        q = db.session.query(cls).filter_by(id=id)
        q.delete()
