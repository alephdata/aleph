import logging

from aleph.core import db, url_for
from aleph.model.common import TimeStampedModel, make_token

log = logging.getLogger(__name__)


class Source(db.Model, TimeStampedModel):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.Unicode, nullable=True)
    category = db.Column(db.Unicode, nullable=True)
    foreign_id = db.Column(db.Unicode, unique=True, nullable=False)

    @classmethod
    def create(cls, data):
        foreign_id = data.get('foreign_id')
        src = Source.by_foreign_id(foreign_id)
        if src is not None:
            return src
        src = cls()
        src.foreign_id = foreign_id or make_token()
        src.update(data)
        db.session.add(src)
        db.session.flush()
        return src

    def update(self, data):
        self.label = data.get('label')
        if 'category' in data:
            self.category = data.get('category')

    def delete(self):
        from aleph.model import Document, DocumentPage, Reference
        sq = db.session.query(Document.id)
        sq = sq.filter(Document.source_id == self.id)
        sq = sq.subquery()

        q = db.session.query(DocumentPage)
        q = q.filter(DocumentPage.document_id.in_(sq))
        q.delete(synchronize_session='fetch')

        q = db.session.query(Reference)
        q = q.filter(Reference.document_id.in_(sq))
        q.delete(synchronize_session='fetch')

        q = db.session.query(Document)
        q = q.filter(Document.source_id == self.id)
        q.delete(synchronize_session='fetch')

        db.session.delete(self)

    def to_dict(self):
        return {
            'api_url': url_for('sources.view', id=self.id),
            'id': self.id,
            'foreign_id': self.foreign_id,
            'label': self.label,
            'category': self.category,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def by_id(cls, id):
        return db.session.query(cls).filter_by(id=id).first()

    @classmethod
    def by_foreign_id(cls, foreign_id):
        if foreign_id is None:
            return
        return db.session.query(cls).filter_by(foreign_id=foreign_id).first()

    @classmethod
    def all(cls, ids=None):
        q = db.session.query(cls)
        if ids is not None:
            q = q.filter(cls.id.in_(ids))
        return q

    @classmethod
    def all_by_id(cls, ids=None):
        q = db.session.query(cls)
        if ids is not None:
            q = q.filter(cls.id.in_(ids))
        data = {}
        for source in q:
            data[source.id] = source
        return data

    def __repr__(self):
        return '<Source(%r)>' % self.id

    def __unicode__(self):
        return self.label
