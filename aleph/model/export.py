import logging

from normality import stringify
from flask_babel import lazy_gettext
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model import Role, Collection
from aleph.model.common import IdModel, DatedModel

log = logging.getLogger(__name__)


class Export(db.Model, IdModel, DatedModel):
    """A data export run in the background. The data is stored in a cloud
    storage bucket and the user is given a link to download the data. The link
    expires after a fixed duration and the exported data is deleted. """

    MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024  # 10 GB
    EXPORT_STATUS = {
        "pending": lazy_gettext("pending"),
        "successful": lazy_gettext("successful"),
        "failed": lazy_gettext("failed"),
    }
    DEFAULT_STATUS = "pending"

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
    export_status = db.Column(db.Unicode, default=DEFAULT_STATUS)

    content_hash = db.Column(db.Unicode(65), index=True)
    file_size = db.Column(db.BigInteger)  # In bytes
    file_name = db.Column(db.Unicode)
    meta = db.Column(JSONB, default={})

    def to_dict(self):
        data = self.to_dict_dates()
        if self.export_status in self.EXPORT_STATUS:
            data["export_status"] = self.EXPORT_STATUS.get(self.export_status)
        data.update(
            {
                "id": stringify(self.id),
                "label": self.label,
                "export_op": self.export_op,
                "creator_id": stringify(self.creator_id),
                "expires_at": self.expires_at,
                "deleted": self.deleted,
                "export_status": self.export_status,
                "content_hash": self.content_hash,
                "file_size": self.file_size,
                "file_name": self.file_name,
                "meta": self.meta,
            }
        )
        return data
