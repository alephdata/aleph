import logging
from datetime import datetime

from sqlalchemy import or_
from sqlalchemy_utils.types.json import JSONType

from aleph.core import db, archive, url_for
from aleph.model.user import User
from aleph.model.forms import SourceEditForm, SourceCreateForm

log = logging.getLogger(__name__)


source_user_table = db.Table('source_user', db.metadata,
    db.Column('source_slug', db.Unicode, db.ForeignKey('source.slug')), # noqa
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')) # noqa
)


class Source(db.Model):
    slug = db.Column(db.Unicode, nullable=False, primary_key=True)
    label = db.Column(db.Unicode, nullable=True)
    public = db.Column(db.Boolean, default=True)
    crawler = db.Column(db.Unicode)
    config = db.Column(JSONType, nullable=True, default={})

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    users = db.relationship(User, secondary=source_user_table,
                            backref='sources')

    def __repr__(self):
        return '<Source(%r)>' % self.slug

    def __unicode__(self):
        return self.label

    def update(self, data, user):
        data = SourceEditForm().deserialize(data)
        self.update_data(data, user)

    def update_data(self, data, user):
        self.label = data.get('label')
        self.public = data.get('public')
        self.config = data.get('config')
        users = set(data.get('users', []))
        if user is not None:
            users.add(user)
        self.users = list(users)

    def to_dict(self):
        return {
            'api_url': url_for('sources.view', slug=self.slug),
            'slug': self.slug,
            'label': self.label,
            'public': self.public,
            'crawler': self.crawler,
            # 'config': self.config,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @property
    def crawler_instance(self):
        if not hasattr(self, '_crawler_instance'):
            from aleph.crawlers.crawler import get_crawlers
            cls = get_crawlers().get(self.crawler)
            if cls is None:
                raise TypeError("Invalid crawler: %r" % self.crawler)
            self._crawler_instance = cls(self)
        return self._crawler_instance

    @property
    def store(self):
        return archive.get(self.slug)

    @classmethod
    def by_slug(cls, slug, commit_on_create=True):
        q = db.session.query(cls).filter_by(slug=slug)
        source = q.first()
        if source is None and slug in archive:
            source = cls.create(slug)
            if commit_on_create:
                db.session.commit()
        return source

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
    def create(cls, data, user=None):
        src = cls()
        data = SourceCreateForm().deserialize(data)
        src.slug = data.get('slug')
        src.crawler = data.get('crawler')
        src.update_data(data, user)
        db.session.add(src)
        return src

    @classmethod
    def delete_by_slug(cls, slug):
        q = db.session.query(cls).filter_by(slug=slug)
        q.delete()

    @classmethod
    def sync(cls):
        existing = cls.list_all_slugs()
        for collection in archive:
            if collection.name not in existing:
                cls.create({
                    'slug': collection.name,
                    'label': collection.name
                })
        db.session.commit()
