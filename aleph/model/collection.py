import logging
from datetime import datetime
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash

from storyweb.core import db, login_manager

log = logging.getLogger(__name__)


@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.Unicode, nullable=False)
    display_name = db.Column(db.Unicode)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    active = db.Column(db.Boolean, nullable=False, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    @property
    def password(self):
        return self.password_hash

    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

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
            'display_name': self.display_name
        }
