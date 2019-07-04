import os
import shutil
from pathlib import Path
from tempfile import mkdtemp
from datetime import datetime
from servicelayer import settings as sls
from flask_testing import TestCase as FlaskTestCase
from followthemoney.cli.util import read_entity
from faker import Factory

from aleph import settings
from aleph.queues import get_queue, OP_INDEX
from aleph.model import Role, Collection, Permission, Entity
from aleph.index.admin import delete_index, upgrade_search, clear_index
from aleph.logic.aggregator import drop_aggregator
from aleph.logic.collections import update_collection
from aleph.logic.processing import index_entities, process_collection
from aleph.logic.roles import create_system_roles
from aleph.migration import destroy_db
from aleph.core import db, kv, create_app
from aleph.views import mount_app_blueprints
from aleph.oauth import oauth

APP_NAME = 'aleph-test'
UI_URL = 'http://aleph.ui/'
FIXTURES = os.path.join(os.path.dirname(__file__), 'fixtures')
DB_URI = settings.DATABASE_URI + '_test'


def read_entities(file_name):
    now = datetime.utcnow()
    entities = []
    with open(file_name) as fh:
        while True:
            entity = read_entity(fh)
            if entity is None:
                break
            entity.set('indexUpdatedAt', now, quiet=True)
            entities.append(entity)
    return entities


class TestCase(FlaskTestCase):

    # Expose faker since it should be easy to use
    fake = Factory.create()

    def create_app(self):
        oauth.remote_apps = {}

        # The testing configuration is inferred from the production
        # settings, but it can only be derived after the config files
        # have actually been evaluated.
        sls.REDIS_URL = None
        settings.APP_NAME = APP_NAME
        settings.TESTING = True
        settings.DEBUG = True
        settings.CACHE = True
        settings.EAGER = True
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
        settings._gcp_logger = None
        app = create_app({})
        mount_app_blueprints(app)
        return app

    def create_user(self, foreign_id='tester', name=None, email=None,
                    is_admin=False):
        role = Role.load_or_create(foreign_id, Role.USER,
                                   name or foreign_id,
                                   email=email or self.fake.email(),
                                   is_admin=is_admin)
        db.session.commit()
        return role

    def login(self, foreign_id='tester', name=None, email=None,
              is_admin=False):
        role = self.create_user(foreign_id=foreign_id,
                                name=name,
                                email=email,
                                is_admin=is_admin)
        headers = {'Authorization': role.api_key}
        return role, headers

    def create_collection(self, creator=None, **kwargs):
        collection = Collection.create(kwargs, creator=creator)
        db.session.add(collection)
        db.session.commit()
        update_collection(collection)
        return collection

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
        self.private_coll = Collection.create({
            'foreign_id': 'test_private',
            'label': "Private Collection",
            'category': 'grey'
        })
        self._banana = Entity.create({
            'schema': 'Person',
            'properties': {
                'name': ['Banana'],
            }
        }, self.private_coll)
        user = Role.by_foreign_id(Role.SYSTEM_USER)
        Permission.grant(self.private_coll, user, True, False)
        self.public_coll = Collection.create({
            'foreign_id': 'test_public',
            'label': "Public Collection",
            'category': 'news'
        })
        self._kwazulu = Entity.create({
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
        process_collection(self.public_coll, ingest=False)
        queue = get_queue(self.private_coll, OP_INDEX)
        samples = read_entities(self.get_fixture_path('samples.ijson'))
        drop_aggregator(self.private_coll)
        index_entities(queue, self.private_coll, samples, sync=True)
        process_collection(self.private_coll, ingest=False)

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
