from aleph.core import db, mail
from aleph.logic.api_keys import generate_user_api_key
from aleph.tests.util import TestCase


class ApiKeysTestCase(TestCase):
    def test_generate_user_api_key(self):
        role = self.create_user()
        assert role.api_key is None

        generate_user_api_key(role)
        db.session.refresh(role)
        assert role.api_key is not None

        old_key = role.api_key
        generate_user_api_key(role)
        db.session.refresh(role)
        assert role.api_key != old_key

    def test_generate_user_api_key_notification(self):
        role = self.create_user(email="john.doe@example.org")
        assert role.api_key is None

        with mail.record_messages() as outbox:
            assert len(outbox) == 0
            generate_user_api_key(role)
            assert len(outbox) == 1

            msg = outbox[0]
            assert msg.recipients == ["john.doe@example.org"]
            assert msg.subject == "[Aleph] API key generated"
            assert "An API key has been generated for your account" in msg.body
            assert "An API key has been generated for your account" in msg.html

        with mail.record_messages() as outbox:
            assert len(outbox) == 0
            generate_user_api_key(role)
            assert len(outbox) == 1

            msg = outbox[0]
            assert msg.recipients == ["john.doe@example.org"]
            assert msg.subject == "[Aleph] API key regenerated"
            assert "Your API key has been regenerated" in msg.body
            assert "Your API key has been regenerated" in msg.html
