import logging
from datetime import datetime

from aleph.core import db
from aleph.model.common import DatedModel
from aleph.model.common import ENTITY_ID_LEN

log = logging.getLogger(__name__)


class Linkage(db.Model, DatedModel):
    """Linkages establish a link between an entity and a profile.
    They can express either that an entity is likely part of the
    profile, that it certainly is part of the profile or that it
    is certainly not part of the profile.
    """
    id = db.Column(db.BigInteger, primary_key=True)
    profile_id = db.Column(db.String(ENTITY_ID_LEN), index=True)
    entity_id = db.Column(db.String(ENTITY_ID_LEN))
    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    score = db.Column(db.Float(), nullable=True)
    decision = db.Column(db.Boolean, default=None, nullable=True)
    decider_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)  # noqa
    context_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)  # noqa

    @classmethod
    def save(cls, profile_id, entity_id, collection_id, context_id,
             score=None, decision=None, decider_id=None):
        q = cls.by_profile(profile_id)
        q = q.filter(cls.entity_id == entity_id)
        q = q.filter(cls.collection_id == collection_id)
        q = q.filter(cls.context_id == context_id)
        obj = q.first()
        if obj is None:
            obj = cls()
            obj.profile_id = profile_id
            obj.entity_id = entity_id
            obj.collection_id = collection_id
            obj.context_id = context_id
        obj.decision = decision
        if decider_id is not None:
            obj.decider_id = decider_id
        if score is not None:
            obj.score = score
        obj.updated_at = datetime.utcnow()
        db.session.add(obj)
        db.session.flush()
        return obj

    @classmethod
    def by_profile(cls, profile_id):
        q = cls.all()
        q = q.filter(cls.profile_id == profile_id)
        return q
