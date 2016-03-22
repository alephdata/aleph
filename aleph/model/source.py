import logging

from aleph.core import db, url_for
from aleph.model.validation import validate
from aleph.model.common import DatedModel, make_token

log = logging.getLogger(__name__)


class Source(db.Model, DatedModel):
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
        validate(data, 'source.json#')
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

    @classmethod
    def by_foreign_id(cls, foreign_id):
        if foreign_id is None:
            return
        return cls.all().filter_by(foreign_id=foreign_id).first()

    @classmethod
    def all_by_ids(cls, ids):
        return cls.all().filter(cls.id.in_(ids))

    def __repr__(self):
        return '<Source(%r)>' % self.id

    def __unicode__(self):
        return self.label

    def to_dict(self):
        return {
            'api_url': url_for('sources_api.view', id=self.id),
            'id': self.id,
            'foreign_id': self.foreign_id,
            'label': self.label,
            'category': self.category,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
