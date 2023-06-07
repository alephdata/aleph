import os
from datetime import datetime, timedelta

from aleph.core import db
from aleph.tests.util import TestCase
from aleph import manage

from click.testing import CliRunner


class ManageTestCase(TestCase):
    def setUp(self):
        super(ManageTestCase, self).setUp()
        self.runner = CliRunner()
        # Change to the aleph directory, so CLI tests can find wsgi.py
        os.chdir(os.path.join(os.path.dirname(__file__), ".."))

    # List all collections
    def test_collections(self):
        self.load_fixtures()
        coll1 = self.create_collection(
            foreign_id="test_coll_1",
            label="Test collection 1",
            category="grey",
            creator=self.admin,
        )
        coll2 = self.create_collection(
            foreign_id="test_coll_2",
            label="Test collection 2",
            category="grey",
            creator=self.admin,
        )

        result = self.runner.invoke(manage.collections)
        assert result.exit_code == 0
        assert coll1.foreign_id in result.output
        assert coll1.label in result.output
        assert coll2.foreign_id in result.output
        assert coll2.label in result.output

    # Delete a given collection
    def test_delete(self):
        self.load_fixtures()
        foreign_id = "test_collection"
        label = "Test collection"

        # Create a collection
        coll1 = self.create_collection(
            foreign_id=foreign_id, label=label, category="grey", creator=self.admin
        )
        result = self.runner.invoke(manage.collections)
        assert result.exit_code == 0
        assert foreign_id in result.output
        assert label in result.output

        # Delete it
        result = self.runner.invoke(manage.delete, [foreign_id])
        assert result.exit_code == 0

        # Make sure it's gone
        result = self.runner.invoke(manage.collections)
        assert result.exit_code == 0
        assert foreign_id not in result.output
        assert label not in result.output
