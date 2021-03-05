import logging
from datetime import datetime, timedelta

from normality import stringify
from sqlalchemy.dialects.postgresql import JSONB
from servicelayer.cache import make_key

from aleph.core import db
from aleph.model import Role, Collection
from aleph.model.common import IdModel, DatedModel, Status

log = logging.getLogger(__name__)


class Export(db.Model, IdModel, DatedModel):
    """A data export run in the background. The data is stored in a cloud
    storage bucket and the user is given a link to download the data. The link
    expires after a fixed duration and the exported data is deleted."""

    DEFAULT_EXPIRATION = timedelta(days=30)  # After 30 days

    label = db.Column(db.Unicode)
    operation = db.Column(db.Unicode)
    creator_id = db.Column(db.Integer, db.ForeignKey("role.id"))
    creator = db.relationship(Role, backref=db.backref("exports", lazy="dynamic"))
    collection_id = db.Column(
        db.Integer, db.ForeignKey("collection.id"), index=True, nullable=True
    )
    collection = db.relationship(
        Collection, backref=db.backref("exports", lazy="dynamic")
    )

    expires_at = db.Column(db.DateTime, default=None, nullable=True)
    deleted = db.Column(db.Boolean, default=False)
    status = db.Column("export_status", db.Unicode, default=Status.DEFAULT)

    content_hash = db.Column(db.Unicode(65), index=True, nullable=True)
    file_size = db.Column(db.BigInteger, nullable=True)  # In bytes
    file_name = db.Column(db.Unicode, nullable=True)
    mime_type = db.Column(db.Unicode)
    meta = db.Column(JSONB, default={})

    def to_dict(self):
        data = self.to_dict_dates()
        data.update(
            {
                "id": stringify(self.id),
                "label": self.label,
                "operation": self.operation,
                "creator_id": stringify(self.creator_id),
                "collection_id": self.collection_id,
                "expires_at": self.expires_at,
                "deleted": self.deleted,
                "status": Status.LABEL.get(self.status),
                "content_hash": self.content_hash,
                "file_size": self.file_size,
                "file_name": self.file_name,
                "mime_type": self.mime_type,
                "meta": self.meta,
            }
        )
        return data

    @classmethod
    def create(
        cls, operation, role_id, label, collection=None, mime_type=None, meta=None
    ):
        export = cls()
        export.creator_id = role_id
        export.operation = operation
        export.label = label
        if collection is not None:
            export.collection_id = collection.id
        export.mime_type = mime_type
        export.expires_at = datetime.utcnow() + cls.DEFAULT_EXPIRATION
        export.meta = meta or {}
        db.session.add(export)
        return export

    @property
    def namespace(self):
        return make_key("role", self.creator_id)

    def set_status(self, status):
        self.status = status
        db.session.add(self)

    def should_delete_publication(self):
        """Check whether the published export should be deleted from the archive

        Since we store exports by contenthash, there may be other non-expired exports
        that point to the same file in the archive"""
        q = (
            Export.all()
            .filter(Export.content_hash == self.content_hash)
            .filter(Export.deleted.isnot(True))
            .filter(Export.id != self.id)
        )
        return q.first() is None

    @classmethod
    def get_expired(cls, deleted=False):
        q = cls.all()
        q = q.filter(cls.expires_at <= datetime.utcnow())
        if not deleted:
            q = q.filter(cls.deleted == deleted)
        return q

    @classmethod
    def get_pending(cls):
        q = cls.all()
        q = q.filter(cls.status == Status.PENDING)
        q = q.filter(cls.deleted == False)  # noqa
        return q

    @classmethod
    def by_id(cls, id, role_id=None, deleted=False):
        q = cls.all().filter_by(id=id)
        if role_id is not None:
            q = q.filter(cls.creator_id == role_id)
        if not deleted:
            q = q.filter(cls.deleted == False)  # noqa
        return q.first()

    @classmethod
    def by_role_id(cls, role_id, deleted=False):
        q = cls.all()
        q = q.filter(cls.creator_id == role_id)
        if not deleted:
            q = q.filter(cls.deleted == False)  # noqa
            q = q.filter(cls.expires_at > datetime.utcnow())
        q = q.order_by(cls.created_at.desc())
        return q

    @classmethod
    def by_content_hash(cls, content_hash, deleted=False):
        q = cls.all()
        q = q.filter(cls.content_hash == content_hash)
        if not deleted:
            q = q.filter(cls.deleted == False)  # noqa
        return q

    def __repr__(self):
        return "<Export(%r, %r, %r)>" % (self.id, self.creator_id, self.label)
