import ldap
from flexmock import flexmock

from aleph.core import db
from aleph.model import Role
from aleph.tests.factories.models import RoleFactory

from aleph.core import get_config
from aleph.model.role import LDAPException
from aleph.tests.util import TestCase


class RoleModelTest(TestCase):

    def setUp(self):
        super(RoleModelTest, self).setUp()

        self.role = RoleFactory.create()
        db.session.commit()

    def test_password(self):
        password = self.fake.password()

        role = RoleFactory.create()
        self.assertFalse(role.check_password(password))

        role.set_password(password)
        self.assertTrue(role.check_password(password))

        role.set_password(self.fake.password())
        self.assertFalse(role.check_password(password))

    def test_authenticate_using_ldap_with_blank_password(self):
        secret = ''

        self.assertIsNone(
            Role.authenticate_using_ldap(self.role.email, secret)
        )

    def test_authenticate_using_ldap_with_bad_user_pass(self):
        secret = self.fake.password()
        email = self.fake.email()
        fake_ldap_conn = flexmock(set_option=lambda x, y: x)

        (flexmock(fake_ldap_conn)
         .should_receive('simple_bind_s')
         .with_args(get_config('LDAP_BASE_DN').format(email), secret)
         .and_raise(LDAPException('Failed auth.'))
         .times(1))

        (flexmock(ldap)
         .should_receive('initialize')
         .and_return(fake_ldap_conn))

        self.assertIsNone(
            Role.authenticate_using_ldap(email, secret)
        )

    def test_authenticate_using_ldap_with_good_user_pass(self):
        secret = self.fake.password()
        email = self.fake.email()
        fake_ldap_conn = flexmock(set_option=lambda x, y: x)

        (flexmock(fake_ldap_conn)
         .should_receive('simple_bind_s')
         .with_args(get_config('LDAP_BASE_DN').format(email), secret)
         .and_return(None)
         .times(1))

        (flexmock(fake_ldap_conn)
         .should_receive('unbind_s')
         .and_return(None)
         .times(1))

        (flexmock(ldap)
         .should_receive('initialize')
         .and_return(fake_ldap_conn))

        role = Role.authenticate_using_ldap(email, secret)
        self.assertIsInstance(role, Role)
        self.assertEqual(role.email, email)

    def test_by_email_when_blank_email(self):
        self.assertIsNone(Role.by_email(None))

    def test_by_email_does_not_match(self):
        self.assertIsNone(Role.by_email(self.fake.email()).first())

    def test_by_email_matches(self):
        self.assertEqual(Role.by_email(self.role.email).first(), self.role)

    def test_load_or_create_role_exists(self):
        self.assertEqual(
            Role.load_or_create(
                foreign_id=self.role.foreign_id,
                type=self.role.type,
                name=self.role.name,
                email=self.role.email
            ),
            self.role
        )
