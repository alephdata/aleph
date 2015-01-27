import logging
from datetime import datetime

from aleph.core import db, archive
from aleph.model.util import make_token

log = logging.getLogger(__name__)


class Collection(db.Model):
    slug = db.Column(db.Unicode, nullable=False, primary_key=True)
    label = db.Column(db.Unicode, nullable=True)
    public = db.Column(db.Boolean, default=False)
    token = db.Column(db.Unicode, default=make_token)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    def __repr__(self):
        return '<Collection(%r)>' % self.slug

    def __unicode__(self):
        return self.label

    def to_dict(self):
        return {
            'slug': self.slug,
            'label': self.label
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
    def list_slugs(cls):
        q = db.session.query(cls.slug)
        return [c.slug for c in q.all()]

    @classmethod
    def create_from_store(cls, collection):
        coll = cls()
        coll.slug = collection.name
        coll.label = collection.name
        db.session.add(coll)
        return coll

    @classmethod
    def sync(cls):
        existing = cls.list_slugs()
        for collection in archive:
            if collection.name not in existing:
                cls.create_from_store(collection)
        db.session.commit()

