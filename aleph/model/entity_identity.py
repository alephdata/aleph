import logging

from aleph.core import db
from aleph.model.common import IdModel, DatedModel

log = logging.getLogger(__name__)


class EntityIdentity(db.Model, IdModel, DatedModel):
    CONFIRMED = 1
    REJECTED = 2
    UNDECIDED = 3

    JUDGEMENTS = [1, 2, 3]

    entity_id = db.Column(db.String(32), db.ForeignKey('entity.id'), index=True)  # noqa
    entity = db.relationship('Entity', backref=db.backref('identities', lazy='dynamic'))  # noqa
    match_id = db.Column(db.String(254), index=True, nullable=False)
    judgement = db.Column(db.Integer(), nullable=False)
    judge_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)

    @classmethod
    def judgements_by_entity(cls, entity_id):
        q = db.session.query(cls.match_id, cls.judgement)
        q = q.filter(cls.entity_id == entity_id)
        return {k: v for k, v in q.all()}

    @classmethod
    def entity_ids(cls, entity_id):
        q = db.session.query(cls.match_id)
        q = q.filter(cls.entity_id == entity_id)
        q = q.filter(cls.judgement == cls.CONFIRMED)
        ids = [entity_id]
        for mapped_id, in q.all():
            ids.append(mapped_id)
        return ids

    @classmethod
    def by_entity_match(cls, entity_id, match_id):
        q = db.session.query(cls)
        q = q.filter(cls.entity_id == entity_id)
        q = q.filter(cls.match_id == match_id)
        return q.first()

    @classmethod
    def save(cls, entity_id, match_id, judgement, judge=None):
        obj = cls.by_entity_match(entity_id, match_id)
        if obj is None:
            obj = cls()
            obj.entity_id = entity_id
            obj.match_id = match_id
        obj.judgement = judgement
        obj.judge = judge
        db.session.add(obj)
        return obj

    def __repr__(self):
        return 'EntityIdentity(%r, %r, %r)' % (self.entity_id, self.match_id,
                                               self.judgement)
