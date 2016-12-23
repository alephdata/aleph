import logging

from aleph.core import db
from aleph.model.common import IdModel, DatedModel

log = logging.getLogger(__name__)


class EntityIdentity(db.Model, IdModel, DatedModel):
    CONFIRMED = 1
    REJECTED = 2
    UNDECIDED = 3

    entity_id = db.Column(db.String(32), db.ForeignKey('entity.id'), index=True)  # noqa
    entity = db.relationship('Entity', backref=db.backref('identities', lazy='dynamic'))  # noqa
    match_id = db.Column(db.String(254), index=True, nullable=False)
    judgement = db.Column(db.Integer(), nullable=False)
    judge_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)

    @classmethod
    def by_entity_match(cls, entity_id, match_id):
        pass

    @classmethod
    def save(cls, data, role=None):
        pass

    def __repr__(self):
        return 'EntityIdentity(%r, %r, %r)' % (self.entity_id, self.match_id,
                                               self.judgement)
