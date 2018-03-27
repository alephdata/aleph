import logging

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

    @classmethod
    def make_dossier_id(self):
        return 'dossier-%s' % make_textid()

    @classmethod
    def merge_entity(cls, dossier_id, entity_id):
        # 1. Look up if the entity is in an existing dossier
        # 2. Merge the two dossiers
        pass

    def __repr__(self):
        return '<DossierMatch(%r, %r, %r)>' % \
            (self.dossier_id, self.entity_id, self.match)
