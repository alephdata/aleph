import logging
from datetime import datetime

from sqlalchemy import or_

from aleph.core import db, archive, url_for
from aleph.model.util import make_token
from aleph.model.user import User
from aleph.model.forms import CollectionForm

log = logging.getLogger(__name__)


collection_user_table = db.Table('collection_user', db.metadata,
    db.Column('collection_slug', db.Unicode, db.ForeignKey('collection.slug')), # noqa
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')) # noqa
)


class Collection(db.Model):
    slug = db.Column(db.Unicode, nullable=False, primary_key=True)
    label = db.Column(db.Unicode, nullable=True)
    public = db.Column(db.Boolean, default=False)
    token = db.Column(db.Unicode, default=make_token)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    users = db.relationship(User, secondary=collection_user_table,
                            backref='collections')

    def __repr__(self):
        return '<Collection(%r)>' % self.slug

    def __unicode__(self):
        return self.label

    def update(self, data, user):
        data = CollectionForm().deserialize(data)
        self.label = data.get('label')
        self.public = data.get('public')
        self.users = list(set(data.get('users', []) + [user]))

    def to_dict(self):
        return {
            'api_url': url_for('collections.view', slug=self.slug),
            'slug': self.slug,
            'label': self.label,
            'public': self.public
        }

    @property
    def store(self):
        return archive.get(self.slug)

    @classmethod
    def by_slug(cls, slug, commit_on_create=True):
        q = db.session.query(cls).filter_by(slug=slug)
        coll = q.first()
        if coll is None and coll in archive:
            coll = cls.create_from_store(archive.get(slug))
            if commit_on_create:
                db.session.commit()
        return coll

    @classmethod
    def list_all_slugs(cls):
        q = db.session.query(cls.slug)
        return [c.slug for c in q.all()]

    @classmethod
    def list_user_slugs(cls, user=None, include_public=True):
        logged_in = user is not None and user.is_authenticated()
        q = db.session.query(cls.slug)
        conds = []
        if include_public:
            conds.append(cls.public == True) # noqa
        if logged_in:
            conds.append(cls.users.any(User.id == user.id))
        if not len(conds):
            return
        if not (logged_in and user.is_admin):
            q = q.filter(or_(*conds))
        return [c.slug for c in q.all()]

    @classmethod
    def all_by_user(cls, user):
        q = db.session.query(cls)
        q = q.filter(cls.slug.in_(cls.list_user_slugs(user)))
        return q

    @classmethod
    def create_from_store(cls, collection):
        coll = cls()
        coll.slug = collection.name
        coll.label = collection.name
        db.session.add(coll)
        return coll

    @classmethod
    def sync(cls):
        existing = cls.list_all_slugs()
        for collection in archive:
            if collection.name not in existing:
                cls.create_from_store(collection)
        db.session.commit()

