from datetime import datetime
from normality import stringify
from aleph.core import db
from aleph.model.common import ENTITY_ID_LEN, IdModel


class Bookmark(db.Model, IdModel):
    """A bookmark of an entity created by a user."""

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    role_id = db.Column(db.Integer, db.ForeignKey("role.id"))
    collection_id = db.Column(db.Integer, db.ForeignKey("collection.id"))
    entity_id = db.Column(db.String(ENTITY_ID_LEN))

    def to_dict(self):
        return {
            "id": stringify(self.id),
            "created_at": self.created_at,
            "entity_id": self.entity_id,
            "collection_id": self.collection_id,
        }
