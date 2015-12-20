import logging

from aleph.core import db

log = logging.getLogger(__name__)


class Page(db.Model):

    id = db.Column(db.BigInteger, primary_key=True)
    number = db.Column(db.Integer(), nullable=True)
    text = db.Column(db.Unicode(), nullable=False)
    document_id = db.Column(db.Integer(), db.ForeignKey('document.id'))
    document = db.relationship('Document', backref=db.backref('pages'))

    def __repr__(self):
        return '<Page(%r,%r)>' % (self.document_id, self.number)

    def __unicode__(self):
        return self.number
