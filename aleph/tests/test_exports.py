from datetime import timedelta, datetime

from aleph.core import db, archive
from aleph.model import Export
from aleph.logic.export import create_export, delete_expired_exports, complete_export
from aleph.logic.notifications import get_notifications
from aleph.tests.util import TestCase


class ExportsTestCase(TestCase):
    def setUp(self):
        super(ExportsTestCase, self).setUp()
        self.load_fixtures()
        self.email = "test@pudo.org"
        self.role_email = self.create_user("with_email", email=self.email)

        csv_path = self.get_fixture_path("experts.csv")
        temp_path = self._create_temporary_copy(csv_path, "experts.csv")
        self.export1 = create_export("TEST", self.role_email.id, "test1")
        complete_export(self.export1.id, temp_path, "experts.csv")

        temp_path = self._create_temporary_copy(csv_path, "experts.csv")
        self.export2 = create_export("TEST", self.role_email.id, "test2")
        self.export2.expires_at = datetime.utcnow() + timedelta(days=-1)
        complete_export(self.export2.id, temp_path, "experts.csv")

        source_path = self.get_fixture_path("../util.py")
        temp_path = self._create_temporary_copy(source_path, "init.py")
        self.export3 = create_export("TEST", self.role_email.id, "test3")
        self.export3.expires_at = datetime.utcnow() + timedelta(days=-1)
        complete_export(self.export3.id, temp_path, "init.py")

    def test_create(self):
        assert self.export1.content_hash is not None
        assert self.export1.content_hash == self.export2.content_hash
        assert archive.load_file(self.export1.content_hash) is not None
        assert archive.load_file(self.export1.content_hash) == archive.load_file(
            self.export2.content_hash
        )
        assert self.export1.file_name == self.export2.file_name == "experts.csv"

        res = get_notifications(self.role_email)
        notification_count = res.get("hits").get("total").get("value")
        assert notification_count == 3, notification_count

    def test_delete_expired(self):
        q = Export.by_role_id(self.role_email.id, deleted=True)
        assert q.count() == 3, q.count()

        delete_expired_exports()
        q = Export.by_role_id(self.role_email.id)
        assert q.count() == 1, q.count()
        exp1 = Export.by_id(self.export1.id, deleted=False)
        assert exp1 is not None
        assert exp1.deleted is False
        exp2 = Export.by_id(self.export2.id, deleted=True)
        assert exp2 is not None
        assert exp2.deleted is True

        path = archive.load_file(self.export1.content_hash)
        assert path is not None
        assert path.exists()

        exp1.expires_at = datetime.utcnow() + timedelta(days=-1)
        db.session.add(exp1)
        db.session.commit()

        delete_expired_exports()
        q = Export.by_role_id(self.role_email.id)
        assert q.count() == 0, q.count()
        exp1 = Export.by_id(self.export1.id, deleted=True)
        assert exp1 is not None
        assert exp1.deleted is True
        path = archive.load_file(self.export1.content_hash)
        assert path is not None, path

        path = archive.load_file(self.export3.content_hash)
        assert path is None, path
