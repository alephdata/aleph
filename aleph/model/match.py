import logging
# from datetime import datetime

from aleph.core import db
from aleph.model.common import IdModel, DatedModel

log = logging.getLogger(__name__)


class Match(db.Model, IdModel, DatedModel):
    entity_id = db.Column(db.String(64))
    document_id = db.Column(db.BigInteger())
    collection_id = db.Column(db.Integer,
                              db.ForeignKey('collection.id'),
                              index=True)
    match_id = db.Column(db.String(64))
    match_collection_id = db.Column(db.Integer,
                                    db.ForeignKey('collection.id'),
                                    index=True)
    score = db.Column(db.Float(), nullable=True)

    def __repr__(self):
        return 'Match(%r, %r, %r, %r)' % (self.entity_id,
                                          self.document_id,
                                          self.match_id,
                                          self.score)
