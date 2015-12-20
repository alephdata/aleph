import logging

from aleph.core import db, login_manager, url_for
from aleph.model.common import make_token
from aleph.model.common import TimeStampedModel
from aleph.model.forms import UserForm

log = logging.getLogger(__name__)


@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))


class User(db.Model, TimeStampedModel):
    id = db.Column(db.Integer, primary_key=True)
    oauth = db.Column(db.Unicode(254))
    email = db.Column(db.Unicode, nullable=True)
    name = db.Column(db.Unicode, nullable=True)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    api_key = db.Column(db.Unicode, default=make_token)

    def is_active(self):
        return True

    def is_authenticated(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return unicode(self.id)

    def __repr__(self):
        return '<User(%r,%r)>' % (self.id, self.email)

    def __unicode__(self):
        return self.name

    def to_dict(self):
        return {
            'id': self.id,
            'api_url': url_for('users.view', id=self.id),
            'email': self.email,
            'name': self.name
        }

    def update(self, data):
        data = UserForm().deserialize(data)
        self.name = data.get('name')
        self.email = data.get('email')

    @classmethod
    def load(cls, data):
        user = cls.by_oauth(data.get('oauth'))
        if user is None:
            user = cls()
            user.oauth = data.get('oauth')

        if not user.name:
            user.name = data.get('name')
        if not user.email:
            user.email = data.get('email')
        db.session.add(user)
        return user

    @classmethod
    def all(cls):
        return db.session.query(cls)

    @classmethod
    def by_id(cls, id):
        q = db.session.query(cls).filter_by(id=int(id))
        return q.first()

    @classmethod
    def by_oauth(cls, oauth):
        q = db.session.query(cls).filter_by(oauth=oauth)
        return q.first()

    @classmethod
    def by_api_key(cls, api_key):
        q = db.session.query(cls).filter_by(api_key=api_key)
        return q.first()
