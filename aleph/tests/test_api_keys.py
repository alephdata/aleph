import datetime
import time_machine

from aleph.core import db, mail
from aleph.logic.api_keys import (
    generate_user_api_key,
    send_api_key_expiration_notifications,
    hash_plaintext_api_keys,
)
from aleph.logic.util import hash_api_key
from aleph.tests.util import TestCase


class ApiKeysTestCase(TestCase):
    def test_generate_user_api_key(self):
        role = self.create_user()
        assert role.api_key_digest is None
        assert role.api_key_expires_at is None

        with time_machine.travel("2024-01-01T00:00:00Z"):
            generate_user_api_key(role)
            db.session.refresh(role)
            assert role.api_key_digest is not None
            assert role.api_key_expires_at.date() == datetime.date(2024, 3, 31)

        old_digest = role.api_key_digest

        with time_machine.travel("2024-02-01T00:00:00Z"):
            generate_user_api_key(role)
            db.session.refresh(role)
            assert role.api_key_digest != old_digest
            assert role.api_key_expires_at.date() == datetime.date(2024, 5, 1)

    def test_generate_user_api_key_notification(self):
        role = self.create_user(email="john.doe@example.org")
        assert role.api_key_digest is None

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

    def test_send_api_key_expiration_notifications(self):
        role = self.create_user(email="john.doe@example.org")

        with mail.record_messages() as outbox:
            with time_machine.travel("2024-01-01T00:00:00Z"):
                assert len(outbox) == 0
                generate_user_api_key(role)
                assert len(outbox) == 1
                assert outbox[0].subject == "[Aleph] API key generated"

                assert role.api_key_digest is not None
                assert role.api_key_expires_at.date() == datetime.date(2024, 3, 31)

                assert len(outbox) == 1
                send_api_key_expiration_notifications()
                assert len(outbox) == 1

            # A notification is sent 7 days before the notification date
            with time_machine.travel("2024-03-24T00:00:00Z"):
                assert len(outbox) == 1
                send_api_key_expiration_notifications()
                assert len(outbox) == 2

                msg = outbox[-1]
                assert msg.recipients == ["john.doe@example.org"]
                assert msg.subject == "[Aleph] Your API key will expire in 7 days"
                assert (
                    "Your API key will expire in 7 days, on Mar 31, 2024, 12:00:00\u202fAM UTC."
                    in msg.body
                )
                assert (
                    "Your API key will expire in 7 days, on Mar 31, 2024, 12:00:00\u202fAM UTC."
                    in msg.html
                )

            # The notification is sent only once
            with time_machine.travel("2024-03-25T00:00:00Z"):
                assert len(outbox) == 2
                send_api_key_expiration_notifications()
                assert len(outbox) == 2

            # Another notification is sent when the key has expired
            with time_machine.travel("2024-03-31T00:00:00Z"):
                assert len(outbox) == 2
                send_api_key_expiration_notifications()
                assert len(outbox) == 3

                msg = outbox[-1]
                assert msg.recipients == ["john.doe@example.org"]
                assert msg.subject == "[Aleph] Your API key has expired"
                assert (
                    "Your API key has expired on Mar 31, 2024, 12:00:00\u202fAM UTC."
                    in msg.body
                )
                assert (
                    "Your API key has expired on Mar 31, 2024, 12:00:00\u202fAM UTC."
                    in msg.html
                )

            # The notification is sent only once
            with time_machine.travel("2024-03-31T00:00:00Z"):
                assert len(outbox) == 3
                send_api_key_expiration_notifications()
                assert len(outbox) == 3

    def test_send_api_key_expiration_notifications_no_key(self):
        role = self.create_user(email="john.doe@example.org")
        assert role.api_key_digest is None

        with mail.record_messages() as outbox:
            assert len(outbox) == 0
            send_api_key_expiration_notifications()
            assert len(outbox) == 0

    def test_send_api_key_expiration_notifications_delay(self):
        role = self.create_user(email="john.doe@example.org")

        with mail.record_messages() as outbox:
            with time_machine.travel("2024-01-01T00:00:00Z"):
                assert len(outbox) == 0
                generate_user_api_key(role)
                assert len(outbox) == 1
                assert outbox[0].subject == "[Aleph] API key generated"

            # Notifications are sent even if the task that sends them is executed with a delay,
            # for example 6 days before the key expires
            with time_machine.travel("2024-03-26T00:00:00Z"):
                assert len(outbox) == 1
                send_api_key_expiration_notifications()
                assert len(outbox) == 2

                msg = outbox[-1]
                assert msg.recipients == ["john.doe@example.org"]
                assert msg.subject == "[Aleph] Your API key will expire in 7 days"

            # 1 day after the key has expired
            with time_machine.travel("2024-04-01T00:00:00Z"):
                assert len(outbox) == 2
                send_api_key_expiration_notifications()
                assert len(outbox) == 3

                msg = outbox[-1]
                assert msg.recipients == ["john.doe@example.org"]
                assert msg.subject == "[Aleph] Your API key has expired"

    def test_send_api_key_expiration_notifications_regenerate(self):
        role = self.create_user(email="john.doe@example.org")

        with mail.record_messages() as outbox:
            with time_machine.travel("2024-01-01T00:00:00Z"):
                assert len(outbox) == 0
                generate_user_api_key(role)
                assert len(outbox) == 1
                assert outbox[0].subject == "[Aleph] API key generated"

            # 90 days after generating the initial API key
            with time_machine.travel("2024-03-31T00:00:00Z"):
                assert len(outbox) == 1
                send_api_key_expiration_notifications()
                assert len(outbox) == 3

                assert outbox[1].subject == "[Aleph] Your API key will expire in 7 days"
                assert outbox[2].subject == "[Aleph] Your API key has expired"

                # Regenerate the key after it has expired
                assert len(outbox) == 3
                generate_user_api_key(role)
                assert len(outbox) == 4
                assert outbox[3].subject == "[Aleph] API key regenerated"

            # 90 days after regenerating the API key
            with time_machine.travel("2024-06-29T00:00:00Z"):
                assert len(outbox) == 4
                send_api_key_expiration_notifications()
                assert len(outbox) == 6

                assert outbox[4].subject == "[Aleph] Your API key will expire in 7 days"
                assert outbox[5].subject == "[Aleph] Your API key has expired"

    def test_hash_plaintext_api_keys(self):
        user_1 = self.create_user(foreign_id="user_1", email="user1@example.org")
        user_1.api_key = "1234567890"
        user_1.api_key_digest = None

        user_2 = self.create_user(foreign_id="user_2", email="user2@example.org")
        user_2.api_key = None
        user_2.api_key_digest = None

        db.session.add_all([user_1, user_2])
        db.session.commit()

        hash_plaintext_api_keys()

        db.session.refresh(user_1)
        assert user_1.api_key is None
        assert user_1.api_key_digest == hash_api_key("1234567890")

        db.session.refresh(user_2)
        assert user_2.api_key is None
        assert user_2.api_key_digest is None
