import json

from aleph.core import db, mail
from aleph.model import Role
from aleph.tests.util import TestCase
from aleph.tests.factories.models import RoleFactory


class RolesApiTestCase(TestCase):

    def setUp(self):
        super(RolesApiTestCase, self).setUp()
        self.create_user(foreign_id='user_1')
        self.create_user(foreign_id='user_2')
        self.rolex = self.create_user(foreign_id='user_3')

    def test_suggest(self):
        res = self.client.get('/api/2/roles/_suggest')
        assert res.status_code == 403, res
        _, headers = self.login(is_admin=True)
        res = self.client.get('/api/2/roles/_suggest?prefix=user',
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] >= 3, res.json

    def test_view(self):
        res = self.client.get('/api/2/roles/%s' % self.rolex)
        assert res.status_code == 404, res
        role, headers = self.login()
        res = self.client.get('/api/2/roles/%s' % role.id,
                              headers=headers)
        assert res.status_code == 200, res
        # assert res.json['total'] >= 6, res.json

    def test_update(self):
        res = self.client.post('/api/2/roles/%s' % self.rolex)
        assert res.status_code == 404, res
        role, headers = self.login()
        url = '/api/2/roles/%s' % role.id
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        data = res.json
        data['name'] = 'John Doe'
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, res
        assert res.json['name'] == data['name'], res.json

        data['name'] = ''
        res = self.client.post(url, data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 400, res

    def test_invite_email_when_no_email(self):
        with mail.record_messages() as outbox:
            res = self.client.post('/api/2/roles/invite')
            assert res.status_code == 400, res
            assert len(outbox) == 0, outbox

    def test_invite_email_has_email(self):
        email = self.fake.email()
        with mail.record_messages() as outbox:
            res = self.client.post(
                '/api/2/roles/invite',
                data=dict(email=email)
            )
            assert res.status_code == 200, res
            assert len(outbox) == 1, outbox
            assert email in outbox[0].recipients, outbox[0]

    def test_create_no_payload(self):
        self.app.config['PASSWORD_REGISTRATION'] = True
        res = self.client.post('/api/2/roles')
        assert res.status_code == 400, res

    def test_create_no_email(self):
        self.app.config['PASSWORD_REGISTRATION'] = True
        payload = dict(
            email='',
            password=self.fake.password(),
            code=self.fake.md5()
        )
        res = self.client.post('/api/2/roles', data=payload)
        assert res.status_code == 400, res

    def test_create_no_pass(self):
        self.app.config['PASSWORD_REGISTRATION'] = True
        payload = dict(
            email=self.fake.email(),
            password='',
            code=self.fake.md5()
        )
        res = self.client.post('/api/2/roles', data=payload)
        assert res.status_code == 400, res

    def test_create_no_code(self):
        self.app.config['PASSWORD_REGISTRATION'] = True
        payload = dict(
            email=self.fake.email(),
            password=self.fake.password(),
            code=''
        )
        res = self.client.post('/api/2/roles', data=payload)
        assert res.status_code == 400, res

    def test_create_registration_disabled(self):
        self.app.config['PASSWORD_REGISTRATION'] = False
        email = self.fake.email()
        payload = dict(
            email=email,
            password=self.fake.password(),
            code=Role.SIGNATURE.dumps(email)
        )
        res = self.client.post('/api/2/roles', data=payload)
        assert res.status_code == 403, res

    def test_create_short_pass(self):
        self.app.config['PASSWORD_REGISTRATION'] = True
        email = self.fake.email()
        payload = dict(
            email=email,
            password=self.fake.password()[:3],
            code=Role.SIGNATURE.dumps(email)
        )
        res = self.client.post('/api/2/roles', data=payload)
        assert res.status_code == 400, res

    def test_create_bad_code(self):
        self.app.config['PASSWORD_REGISTRATION'] = True
        email = self.fake.email()
        payload = dict(
            email=email,
            password=self.fake.password()[:3],
            code=Role.SIGNATURE.dumps('huhu')
        )
        res = self.client.post('/api/2/roles', data=payload)
        assert res.status_code == 400, res

    def test_create_success(self):
        self.app.config['PASSWORD_REGISTRATION'] = True
        email = self.fake.email()
        name = self.fake.name()
        password = self.fake.password()
        payload = dict(
            email=email,
            name=name,
            password=password,
            code=Role.SIGNATURE.dumps(email)
        )
        res = self.client.post('/api/2/roles', data=payload)
        db.session.close()

        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json['email'], payload['email'])

        role = Role.by_email(email).first()
        self.assertIsNotNone(role)
        self.assertTrue(role.check_password(password))
        self.assertEqual(role.name, payload['name'])
        self.assertEqual(role.email, payload['email'])

    def test_create_on_existing_email(self):
        self.app.config['PASSWORD_REGISTRATION'] = True
        email = self.fake.email()
        password = self.fake.password()
        payload = dict(
            email=email,
            name=self.fake.name(),
            password=password,
            code=Role.SIGNATURE.dumps(email)
        )

        RoleFactory.create(email=email)
        res = self.client.post('/api/2/roles', data=payload)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json['email'], email)
        role = Role.by_email(email).first()
        self.assertIsNotNone(role)
        self.assertFalse(role.check_password(password))
