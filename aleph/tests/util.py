import os
import shutil
from tempfile import mkdtemp
from flask_testing import TestCase as FlaskTestCase
from flask_fixtures import loaders, load_fixtures
from faker import Factory

from aleph import settings
from aleph.model import Role, Document, Collection, Permission
from aleph.model import create_system_roles, destroy_db
from aleph.index import delete_index, upgrade_search, flush_index
from aleph.index.core import collection_index, entity_index, record_index
from aleph.logic.documents import process_document
from aleph.logic.collections import update_collection, update_collections
from aleph.core import db, es, create_app
from aleph.views import mount_app_blueprints
from aleph.oauth import oauth

APP_NAME = 'aleph_test_instance'
UI_URL = 'http://aleph.ui/'
FIXTURES = os.path.join(os.path.dirname(__file__), 'fixtures')
DB_URI = settings.DATABASE_URI + '_test'


class TestCase(FlaskTestCase):

    # Expose faker since it should be easy to use
    fake = Factory.create()

    def create_app(self):
        oauth.remote_apps = {}

        # The testing configuration is inferred from the production
        # settings, but it can only be derived after the config files
        # have actually been evaluated.
        settings.APP_NAME = APP_NAME
        settings.TESTING = True
        settings.DEBUG = True
        settings.CACHE = True
        settings.SECRET_KEY = 'batman'
        settings.APP_UI_URL = UI_URL
        settings.ARCHIVE_TYPE = 'file'
        settings.ARCHIVE_PATH = self.temp_dir
        settings.DATABASE_URI = DB_URI
        settings.QUEUE = False
        settings.MAIL_SERVER = None
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
        role = self.create_user(foreign_id=foreign_id, name=name, email=email,
                                is_admin=is_admin)
        headers = {'Authorization': role.api_key}
        return role, headers

    def create_collection(self, creator=None, **kwargs):
        collection = Collection.create(kwargs, role=creator)
        db.session.add(collection)
        db.session.commit()
        update_collection(collection)
        return collection

    def grant(self, collection, role, read, write):
        Permission.grant(collection, role, read, write)
        db.session.commit()
        update_collection(collection)

    def flush_index(self):
        flush_index()

    def get_fixture_path(self, file_name):
        return os.path.abspath(os.path.join(FIXTURES, file_name))

    def load_fixtures(self, file_name, process_documents=True):
        filepath = self.get_fixture_path(file_name)
        load_fixtures(db, loaders.load(filepath))
        db.session.commit()
        update_collections()
        if process_documents:
            for doc in Document.all():
                process_document(doc)
        self.flush_index()

    def setUp(self):
        if not hasattr(TestCase, '_global_test_state'):
            TestCase._global_test_state = True
            delete_index()
            upgrade_search()
        else:
            indexes = [
                collection_index(),
                entity_index(),
                record_index()
            ]
            es.delete_by_query(index=indexes,
                               body={'query': {'match_all': {}}},
                               refresh=True,
                               conflicts='proceed')

        destroy_db()
        db.create_all()
        create_system_roles()

    def tearDown(self):
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
