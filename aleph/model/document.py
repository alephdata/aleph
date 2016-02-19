import logging

from sqlalchemy import func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm.attributes import flag_modified

from aleph.core import db
from aleph.model.tabular import Tabular
from aleph.model.source import Source
from aleph.model.metadata import Metadata
from aleph.model.common import TimeStampedModel

log = logging.getLogger(__name__)


class Document(db.Model, TimeStampedModel):
    TYPE_TEXT = 'text'
    TYPE_TABULAR = 'tabular'
    TYPE_OTHER = 'other'

    id = db.Column(db.BigInteger, primary_key=True)
    content_hash = db.Column(db.Unicode(65), nullable=False, index=True)
    foreign_id = db.Column(db.Unicode, unique=False, nullable=True)
    type = db.Column(db.Unicode(10), nullable=False, index=True)
    source_id = db.Column(db.Integer(), db.ForeignKey('source.id'), index=True)
    source = db.relationship(Source, backref=db.backref('documents', lazy='dynamic', cascade='all, delete-orphan'))  # noqa
    _meta = db.Column('meta', JSONB)

    @hybrid_property
    def meta(self):
        self._meta = self._meta or {}
        self._meta['content_hash'] = self.content_hash
        self._meta['foreign_id'] = self.foreign_id
        return Metadata(data=self._meta or {})

    @meta.setter
    def meta(self, meta):
        if isinstance(meta, Metadata):
            self.content_hash = meta.content_hash
            self.foreign_id = meta.foreign_id
            meta = meta.data
        self._meta = meta
        flag_modified(self, '_meta')

    @property
    def tables(self):
        return [Tabular(s) for s in self.meta.tables]

    def __repr__(self):
        return '<Document(%r,%r,%r)>' % (self.id, self.type, self.meta.title)

    def __unicode__(self):
        return self.id

    def to_dict(self):
        data = self.meta.to_dict()
        data.update({
            'id': self.id,
            'type': self.type,
            'source_id': self.source_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        })
        return data

    def delete_pages(self):
        pq = db.session.query(Page)
        pq = pq.filter(Page.document_id == self.id)
        pq.delete(synchronize_session='fetch')
        db.session.refresh(self)

    @classmethod
    def by_id(cls, id):
        q = db.session.query(cls).filter_by(id=id)
        return q.first()

    @classmethod
    def get_max_id(cls):
        q = db.session.query(func.max(cls.id))
        return q.scalar()


class Page(db.Model):

    id = db.Column(db.BigInteger, primary_key=True)
    number = db.Column(db.Integer(), nullable=False)
    text = db.Column(db.Unicode(), nullable=False)
    document_id = db.Column(db.Integer(), db.ForeignKey('document.id'))
    document = db.relationship(Document, backref=db.backref('pages', cascade='all, delete-orphan'))  # noqa

    def __repr__(self):
        return '<Page(%r,%r)>' % (self.document_id, self.number)

    def __unicode__(self):
        return self.number
