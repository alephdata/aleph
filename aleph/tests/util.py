import os
import shutil
from tempfile import mkdtemp
from flask.ext.testing import TestCase as FlaskTestCase
from flask.ext.fixtures import loaders, load_fixtures

from aleph.model import Role, Document, create_system_roles
from aleph.index import delete_index, init_search, optimize_search
from aleph.analyze import analyze_document
from aleph.core import db, create_app
from aleph.views import mount_app_blueprints

FIXTURES = os.path.join(os.path.dirname(__file__), 'fixtures')


class TestCase(FlaskTestCase):

    def create_app(self):
        self.temp_dir = mkdtemp()
        app = create_app({
            'DEBUG': True,
            'TESTING': True,
            'CACHE': True,
            'SECRET_KEY': 'batman',
            'ARCHIVE_TYPE': 'file',
            'ARCHIVE_PATH': self.temp_dir,
            'APP_NAME': 'aleph_test_name',
            'PRESERVE_CONTEXT_ON_EXCEPTION': False,
            'CELERY_ALWAYS_EAGER': True
        })
        mount_app_blueprints(app)
        return app

    def create_user(self, foreign_id='tester', name=None, email=None,
                    is_admin=False):
        role = Role.load_or_create(foreign_id, Role.USER, name or foreign_id,
                                   email=email, is_admin=is_admin)
        db.session.commit()
        return role

    def login(self, foreign_id='tester', name=None, email=None,
              is_admin=False):
        role = self.create_user(foreign_id=foreign_id, name=name, email=email,
                                is_admin=is_admin)
        with self.client.session_transaction() as sess:
            sess['roles'] = [Role.system(Role.SYSTEM_GUEST),
                             Role.system(Role.SYSTEM_USER), role.id]
            sess['user'] = role.id
        return role

    def load_fixtures(self, file_name, process_documents=True):
        filepath = os.path.abspath(os.path.join(FIXTURES, file_name))
        load_fixtures(db, loaders.load(filepath))
        db.session.commit()
        if process_documents:
            for doc_id, in Document.all_ids():
                analyze_document(doc_id)
            optimize_search()

    def setUp(self):
        try:
            os.makedirs(self.temp_dir)
        except:
            pass
        delete_index()
        init_search()
        db.drop_all()
        db.create_all()
        create_system_roles()

    def tearDown(self):
        db.session.close()
        shutil.rmtree(self.temp_dir)
