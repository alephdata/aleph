import logging
from datetime import datetime
from sqlalchemy.dialects.postgresql import ARRAY

from aleph.core import db
from aleph.model.collection import Collection
from aleph.model.common import IdModel, SoftDeleteModel

log = logging.getLogger(__name__)


class DossierLink(db.Model, IdModel, SoftDeleteModel):
    """A link defines a dossier pseudo-object to be relevant to a particular
    collection (usually a casefile). It carries additional information, like
    a description of why the dossier is relevant to the case, and some tags
    to classify the involvement of the dossier."""

    text = db.Column(db.Unicode, nullable=True)
    tags = db.Column(ARRAY(db.Unicode()), default=[])
    dossier_id = db.Column(db.String(42), index=True)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)  # noqa

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref('links', lazy='dynamic'))  # noqa

    @classmethod
    def delete_by_collection(cls, collection_id, deleted_at=None):
        deleted_at = deleted_at or datetime.utcnow()
        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq = pq.filter(cls.deleted_at == None)  # noqa
        pq.update({cls.deleted_at: deleted_at},
                  synchronize_session=False)

    def __repr__(self):
        return '<DossierLink(%r, %r, %r)>' % (self.dossier_id, self.collection_id)
