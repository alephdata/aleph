import os
import gc
import shutil
import unittest
from flask import json
from pathlib import Path
from tempfile import mkdtemp
from datetime import datetime
from servicelayer import settings as sls
from followthemoney.cli.util import read_entity
from werkzeug.utils import cached_property
from faker import Factory

from aleph import settings
from aleph.authz import Authz
from aleph.queues import get_stage, OP_PROCESS
from aleph.model import Role, Collection, Permission, Entity
from aleph.index.admin import delete_index, upgrade_search, clear_index
from aleph.logic.aggregator import drop_aggregator, get_aggregator
from aleph.logic.collections import update_collection, process_collection
from aleph.logic.processing import index_aggregate
from aleph.logic.roles import create_system_roles
from aleph.migration import destroy_db
from aleph.core import db, kv, create_app
from aleph.oauth import oauth

APP_NAME = 'aleph-test'
UI_URL = 'http://aleph.ui/'
FIXTURES = os.path.join(os.path.dirname(__file__), 'fixtures')
DB_URI = settings.DATABASE_URI + '_test'


def read_entities(file_name):
    now = datetime.utcnow()
    with open(file_name) as fh:
        while True:
            entity = read_entity(fh)
            if entity is None:
                break
            entity.set('indexUpdatedAt', now, quiet=True)
            yield entity


class JsonResponseMixin(object):
    """
    Mixin with testing helper methods
    """

    @cached_property
    def json(self):
        return json.loads(self.data)


def _make_test_response(response_class):
    class TestResponse(response_class, JsonResponseMixin):
        pass
    return TestResponse


class TestCase(unittest.TestCase):

    # Expose faker since it should be easy to use
    fake = Factory.create()

    def create_app(self):
        oauth.remote_apps = {}

        # The testing configuration is inferred from the production
        # settings, but it can only be derived after the config files
        # have actually been evaluated.
        sls.REDIS_URL = None
        sls.WORKER_THREADS = None
        settings.APP_NAME = APP_NAME
        settings.TESTING = True
        settings.DEBUG = True
        settings.CACHE = True
        settings.OAUTH = False
        settings.SECRET_KEY = 'batman'
        settings.APP_UI_URL = UI_URL
        settings.ARCHIVE_TYPE = 'file'
        settings.ARCHIVE_PATH = self.temp_dir
        settings.DATABASE_URI = DB_URI
        settings.ALEPH_PASSWORD_LOGIN = True
        settings.MAIL_SERVER = None
        settings.INDEX_PREFIX = APP_NAME
        settings.INDEX_WRITE = 'yolo'
        settings.INDEX_READ = [settings.INDEX_WRITE]
        settings.TAG_ENTITIES = True
        settings._gcp_logger = None
        app = create_app({})
        return app

    def create_user(self, foreign_id='tester', name=None, email=None,
                    is_admin=False):
        role = Role.load_or_create(foreign_id, Role.USER,
                                   name or foreign_id,
                                   email=email or self.fake.email(),
                                   is_admin=is_admin)
        db.session.commit()
        return role

    def create_group(self, foreign_id='group', *members):
        group = Role.load_or_create(foreign_id, Role.GROUP, foreign_id)
        for member in members:
            member.add_role(group)
        db.session.commit()
        return group

    def login(self, foreign_id='tester', name=None, email=None,
              is_admin=False):
        role = self.create_user(foreign_id=foreign_id,
                                name=name,
                                email=email,
                                is_admin=is_admin)
        headers = {'Authorization': role.api_key}
        return role, headers

    def create_collection(self, creator=None, **kwargs):
        authz = Authz.from_role(creator)
        collection = Collection.create(kwargs, authz)
        db.session.add(collection)
        db.session.commit()
        update_collection(collection, sync=True)
        return collection

    def create_entity(self, data, collection):
        return Entity.create(data, collection)

    def grant(self, collection, role, read, write):
        Permission.grant(collection, role, read, write)
        db.session.commit()
        update_collection(collection)

    def grant_publish(self, collection):
        visitor = Role.by_foreign_id(Role.SYSTEM_GUEST)
        self.grant(collection, visitor, True, False)

    def get_fixture_path(self, file_name):
        return Path(os.path.abspath(os.path.join(FIXTURES, file_name)))

    def load_fixtures(self):
        self.admin = self.create_user(foreign_id='admin', is_admin=True)
        self.private_coll = self.create_collection(
            foreign_id='test_private',
            label="Private Collection",
            category='grey',
            casefile=False,
            creator=self.admin
        )
        self._banana = self.create_entity({
            'schema': 'Person',
            'properties': {
                'name': ['Banana'],
            }
        }, self.private_coll)
        user = Role.by_foreign_id(Role.SYSTEM_USER)
        Permission.grant(self.private_coll, user, True, False)
        self.public_coll = self.create_collection(
            foreign_id='test_public',
            label="Public Collection",
            category='news',
            casefile=False,
            creator=self.admin
        )
        self._kwazulu = self.create_entity({
            'schema': 'Company',
            'properties': {
                'name': ['KwaZulu'],
                'alias': ['kwazulu']
            }
        }, self.public_coll)
        visitor = Role.by_foreign_id(Role.SYSTEM_GUEST)
        Permission.grant(self.public_coll, visitor, True, False)
        db.session.commit()

        drop_aggregator(self.public_coll)
        stage = get_stage(self.public_coll, OP_PROCESS)
        process_collection(stage, self.public_coll, ingest=False, sync=True)

        aggregator = get_aggregator(self.private_coll)
        aggregator.delete()
        stage = get_stage(self.private_coll, OP_PROCESS)
        for sample in read_entities(self.get_fixture_path('samples.ijson')):
            aggregator.put(sample, fragment='sample')

        index_aggregate(stage, self.private_coll, sync=True)
        aggregator.close()
        process_collection(stage, self.private_coll, ingest=False, sync=True)

    def setUp(self):
        if not hasattr(settings, '_global_test_state'):
            settings._global_test_state = True
            destroy_db()
            db.create_all()
            delete_index()
            upgrade_search()
        else:
            clear_index()
            for table in reversed(db.metadata.sorted_tables):
                q = 'TRUNCATE %s RESTART IDENTITY CASCADE;' % table.name
                db.engine.execute(q)

        kv.flushall()
        create_system_roles()

    def tearDown(self):
        db.session.rollback()
        db.session.close()

    @classmethod
    def setUpClass(cls):
        cls.temp_dir = mkdtemp()
        try:
            os.makedirs(cls.temp_dir)
        except Exception:
            pass

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.temp_dir)

    def __call__(self, result=None):
        """
        Does the required setup, doing it here
        means you don't have to call super.setUp
        in subclasses.
        """
        try:
            self._pre_setup()
            super(TestCase, self).__call__(result)
        finally:
            self._post_teardown()

    def debug(self):
        try:
            self._pre_setup()
            super(TestCase, self).debug()
        finally:
            self._post_teardown()

    def _pre_setup(self):
        self.app = self.create_app()

        self._orig_response_class = self.app.response_class
        self.app.response_class = _make_test_response(self.app.response_class)

        self.client = self.app.test_client()

        self._ctx = self.app.test_request_context()
        self._ctx.push()

    def _post_teardown(self):
        if getattr(self, '_ctx', None) is not None:
            self._ctx.pop()
            del self._ctx

        if getattr(self, 'app', None) is not None:
            if getattr(self, '_orig_response_class', None) is not None:
                self.app.response_class = self._orig_response_class
            del self.app

        if hasattr(self, 'client'):
            del self.client

        gc.collect()
