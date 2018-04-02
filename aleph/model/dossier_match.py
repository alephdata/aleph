import logging
from datetime import datetime

from aleph.core import db
from aleph.model.common import IdModel, SoftDeleteModel
from aleph.model.common import make_textid

log = logging.getLogger(__name__)


class DossierMatch(db.Model, IdModel, SoftDeleteModel):
    """A dossier match describes an identity between an entity and a dossier.
    The dossier doesn't currently carry further metadata, it is constituted
    by all the entities it encompasses."""

    # The entity ID. Does not need to be in the local DB since it can be
    # bulk-loaded into ElasticSearch:
    entity_id = db.Column(db.String(42), index=True)
    # A randomly generated ID for this dossier:
    dossier_id = db.Column(db.String(42), index=True)
    # Describe if the entity is part of the dossier:
    match = db.Column(db.Boolean, default=None, nullable=True)
    # Describe if a user has made a decision regarding the match:
    decided = db.Column(db.Boolean, default=False)
    # If auto-generated, include a similarity score for ranking:
    score = db.Column(db.Float, default=None, nullable=True)
    # The user that made the matching decision, if any:
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)  # noqa

    def clone(self):
        match = DossierMatch()
        match.dossier_id = self.dossier_id
        match.entity_id = self.entity_id
        match.match = self.match
        match.decided = self.decided
        match.score = self.score
        match.role_id = self.role_id
        match.created_at = self.created_at
        match.updated_at = self.updated_at
        match.deleted_at = self.deleted_at
        return match

    @classmethod
    def make_dossier_id(self):
        return 'ds-%s' % make_textid()

    @classmethod
    def create(cls, entity_id, dossier_id=None, match=True, decided=True,
               score=None, role_id=None):
        """Create a dossier match, which links an entity to be a part of the
        dossier. This can also be created as a speculative link (decided=False,
        match=None), or as a stub that defined the entity not to be part of
        the dossier (match=False)."""
        # Look up if the entity is in an existing dossier. If so, merge
        # the two dossiers into a combined dossier.
        if decided and match:
            q = cls.all()
            q = q.filter(cls.entity_id == entity_id)
            q = q.filter(cls.decided == True)  # noqa
            q = q.filter(cls.match == True)  # noqa
            q = q.order_by(cls.updated_at.desc())
            for match in q:
                if dossier_id is None:
                    dossier_id = match.dossier_id
                cls.merge(dossier_id, match.id)

        q = cls.all()
        q = q.filter(cls.dossier_id == dossier_id)
        q = q.filter(cls.entity_id == entity_id)
        match = q.first()
        if match is None:
            match = cls()
            match.entity_id = entity_id
            match.dossier_id = dossier_id or cls.make_dossier_id()
        match.match = match
        match.decided = decided
        match.score = match.score if score is None else score
        match.role_id = role_id
        db.session.add(match)
        db.session.flush()
        return match

    @classmethod
    def merge(cls, dest_id, from_id, merged_at=None):
        """Merge the matches from the source dossier (from_id) into
        the new destination dossier (dest_id). This becomes complicated
        when both dossiers have a relationship to the given entity. In
        this case the destination match is retained, unless the incoming
        one is decided, and the existing one is not.
        """
        if dest_id == from_id:
            return
        # TODO: do counts and merge from the smaller dossier to the
        # larger dossier so that IDs become stable over time.
        merged_at = merged_at or datetime.utcnow()
        q = cls.all()
        q = q.filter(cls.dossier_id == from_id)
        for match in q.all():
            cls.merge_match(match, dest_id, merged_at)
            match.deleted_at = merged_at
            db.session.add(match)

        # TODO: handle links!
        db.session.flush()

    @classmethod
    def merge_match(cls, match, dest_id, merged_at):
        q = cls.all()
        q = q.filter(cls.dossier_id == dest_id)
        q = q.filter(cls.entity_id == match.entity_id)
        q = q.order_by(cls.updated_at.desc())
        existing = q.first()
        # If this is resolved, don't quibble:
        if existing is not None and existing.decided:
            return existing

        match = match.clone()
        match.updated_at = merged_at
        match.dossier_id = dest_id
        if existing is not None:
            match.score = max(existing.score, match.score)
            if existing.match is not None:
                match.match = existing.match
                match.role_id = existing.role_id
        db.session.add(match)
        return match

    @classmethod
    def find_by_id(cls, dossier_id, deleted=False):
        """Find all matches for a dossier by their ID."""
        q = cls.all(deleted=deleted)
        q = q.filter(cls.dossier_id == dossier_id)
        return q

    @classmethod
    def find_by_entity(cls, entity_id):
        """Find all dossier matches for an entity."""
        q = cls.all()
        q = q.filter(cls.entity_id == entity_id)
        q = q.filter(cls.decided == True)  # noqa
        q = q.filter(cls.match == True)  # noqa
        q = q.order_by(cls.updated_at.desc())
        return q

    def __repr__(self):
        return '<DossierMatch(%r, %r, %r)>' % \
            (self.dossier_id, self.entity_id, self.match)
