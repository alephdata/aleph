import logging
from datetime import datetime

from aleph.core import db, login_manager, url_for
from aleph.model.util import make_token
from aleph.model.forms import UserForm

log = logging.getLogger(__name__)


@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.Unicode, nullable=True)
    display_name = db.Column(db.Unicode, nullable=True)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    active = db.Column(db.Boolean, nullable=False, default=True)

    twitter_id = db.Column(db.Unicode)
    facebook_id = db.Column(db.Unicode)

    api_key = db.Column(db.Unicode, default=make_token)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    def is_active(self):
        return self.active

    def is_authenticated(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return unicode(self.id)

    def __repr__(self):
        return '<User(%r,%r)>' % (self.id, self.email)

    def __unicode__(self):
        return self.display_name

    def to_dict(self):
        return {
            'id': self.id,
            'api_url': url_for('users.view', id=self.id),
            'email': self.email,
            'display_name': self.display_name
        }

    def update(self, data):
        data = UserForm().deserialize(data)
        self.display_name = data.get('display_name')
        self.email = data.get('email')

    @classmethod
    def load(cls, data):
        user = None
        if 'twitter_id' in data:
            user = cls.by_twitter_id(data.get('twitter_id'))
        elif 'facebook_id' in data:
            user = cls.by_facebook_id(data.get('facebook_id'))
        if user is None:
            user = cls()

        user.twitter_id = data.get('twitter_id')
        user.facebook_id = data.get('facebook_id')
        if not user.display_name:
            user.display_name = data.get('display_name')
        if not user.email:
            user.email = data.get('email')
        db.session.add(user)
        return user

    @classmethod
    def all(cls):
        q = db.session.query(cls).filter_by(active=True)
        return q

    @classmethod
    def by_id(cls, id):
        q = db.session.query(cls).filter_by(id=int(id))
        return q.first()

    @classmethod
    def by_api_key(cls, api_key):
        q = db.session.query(cls).filter_by(api_key=api_key)
        return q.first()

    @classmethod
    def by_twitter_id(cls, twitter_id):
        q = db.session.query(cls).filter_by(twitter_id=str(twitter_id))
        return q.first()

    @classmethod
    def by_facebook_id(cls, facebook_id):
        q = db.session.query(cls).filter_by(facebook_id=str(facebook_id))
        return q.first()
