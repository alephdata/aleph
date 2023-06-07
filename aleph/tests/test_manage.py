import os
from click.testing import CliRunner

from aleph.core import db
from aleph.tests.util import TestCase
from aleph import manage
from aleph.model import Role, Collection
from aleph.logic.roles import user_add


class ManageTestCase(TestCase):
    def setUp(self):
        super(ManageTestCase, self).setUp()
        self.load_fixtures()
        self.runner = CliRunner()
        # Change to the aleph directory, so CLI tests can find wsgi.py
        os.chdir(os.path.join(os.path.dirname(__file__), ".."))

    def test_collections(self):
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

    def test_delete(self):
        foreign_id = "test_collection"
        label = "Test collection"

        # Create a collection
        self.create_collection(
            foreign_id=foreign_id, label=label, category="grey", creator=self.admin
        )
        result = self.runner.invoke(manage.collections)
        assert result.exit_code == 0
        assert foreign_id in result.output
        assert label in result.output

        # Delete it
        result = self.runner.invoke(manage.delete, [foreign_id, "--sync"])
        assert result.exit_code == 0

        # Make sure it's gone
        result = self.runner.invoke(manage.collections)
        assert result.exit_code == 0
        assert foreign_id not in result.output
        assert label not in result.output

    def test_createuser(self):
        email = "test@example.com"

        roles = Role.query.all()
        emails = [role.email for role in roles]
        assert email not in emails

        result = self.runner.invoke(
            manage.createuser,
            [email, "--password", "letmein", "--name", "Test User"],
            prog_name="aleph",
        )
        assert result.exit_code == 0
        assert result.output.startswith("User created")
        assert "API Key:" in result.output

        roles = Role.query.all()
        emails = [role.email for role in roles]
        assert email in emails

    def test_renameuser(self):
        email = "test@example.com"
        name = "New Name"

        # Create a user
        result = self.runner.invoke(
            manage.createuser,
            [email, "--password", "letmein", "--name", "Test User"],
            prog_name="aleph",
        )
        assert result.exit_code == 0

        # Rename the user
        result = self.runner.invoke(
            manage.renameuser,
            [email, name],
            prog_name="aleph",
        )
        assert result.exit_code == 0
        assert f"User renamed. ID: " in result.output
        assert f", new name: {name}" in result.output

        # Check that the user was renamed
        role = Role.by_email(email)
        assert role.name == name

    def test_renameuser_nonexistent_user(self):
        email = "nonexistent@example.com"
        name = "New Name"

        # Rename a nonexistent user
        result = self.runner.invoke(
            manage.renameuser,
            [email, name],
            prog_name="aleph",
        )
        assert result.exit_code == 0
        assert f"The e-mail address {email} belongs to no user." in result.output

    def test_groups(self):
        group_name = "Test Group"

        result = self.runner.invoke(manage.groups)
        assert result.exit_code == 0
        assert group_name not in result.output

        self.create_group(group_name)

        result = self.runner.invoke(manage.groups)
        assert result.exit_code == 0
        assert group_name in result.output

    def test_users(self):
        email = "test@example.com"
        name = "Test User"

        # List all users
        result = self.runner.invoke(
            manage.users,
            [],
            prog_name="aleph",
        )
        assert result.exit_code == 0
        assert email not in result.output
        assert name not in result.output

        # Create a user
        result = self.runner.invoke(
            manage.createuser,
            [email, "--password", "letmein", "--name", name],
            prog_name="aleph",
        )
        assert result.exit_code == 0

        # List all users
        result = self.runner.invoke(manage.users)
        assert result.exit_code == 0
        assert email in result.output
        assert name in result.output

    def test_creategroup(self):
        name = "test_group_1"

        role = Role.by_foreign_id(f"group:{name}")
        assert role is None

        result = self.runner.invoke(manage.creategroup, [name], prog_name="aleph")
        assert result.exit_code == 0
        assert f"Group {name} created." in result.output

        role = Role.by_foreign_id(f"group:{name}")
        assert role is not None

    def test_useradd(self):
        # Create a user and a group
        email = "test@example.com"
        name = "Test User"
        group_name = "Test Group"

        result = self.runner.invoke(
            manage.createuser,
            [email, "--password", "letmein", "--name", name],
            prog_name="aleph",
        )
        assert result.exit_code == 0

        result = self.runner.invoke(manage.creategroup, [group_name], prog_name="aleph")
        assert result.exit_code == 0

        # Add the user to the group
        result = self.runner.invoke(
            manage.useradd,
            [group_name, email],
            prog_name="aleph",
        )
        assert result.exit_code == 0

        # Check that the user was added to the group
        user_role = Role.by_email(email)
        group_role = Role.by_foreign_id(f"group:{group_name}")
        assert group_role in user_role.roles

    def test_useradd_nonexistent_user(self):
        # Create a group
        group_name = "Test Group"
        result = self.runner.invoke(manage.creategroup, [group_name], prog_name="aleph")
        assert result.exit_code == 0

        # Add a nonexistent user to the group
        email = "nonexistent@example.com"
        result = self.runner.invoke(
            manage.useradd,
            [group_name, email],
            prog_name="aleph",
        )
        assert result.exit_code != 0
        assert isinstance(result.exception, SystemExit)

    def test_useradd_nonexistent_group(self):
        # Create a user
        email = "test@example.com"
        name = "Test User"
        result = self.runner.invoke(
            manage.createuser,
            [email, "--password", "letmein", "--name", name],
            prog_name="aleph",
        )
        assert result.exit_code == 0

        # Add the user to a nonexistent group
        group_name = "nonexistent"
        result = self.runner.invoke(
            manage.useradd,
            [group_name, email],
            prog_name="aleph",
        )
        assert result.exit_code != 0
        assert isinstance(result.exception, SystemExit)

    def test_userdel(self):
        # Create a user and a group
        email = "test@example.com"
        name = "Test User"
        group_name = "Test Group"

        result = self.runner.invoke(
            manage.createuser,
            [email, "--password", "letmein", "--name", name],
            prog_name="aleph",
        )
        assert result.exit_code == 0

        result = self.runner.invoke(manage.creategroup, [group_name], prog_name="aleph")
        assert result.exit_code == 0

        # Add the user to the group
        user_role, group_role = user_add(group_name, email)
        assert user_role is not None
        assert group_role is not None

        # Remove the user from the group
        result = self.runner.invoke(
            manage.userdel,
            [group_name, email],
            prog_name="aleph",
        )
        assert result.exit_code == 0

        # Check that the user was removed from the group
        user_role = Role.by_email(email)
        group_role = Role.by_foreign_id(f"group:{group_name}")
        assert group_role not in user_role.roles

    def test_userdel_nonexistent_user(self):
        # Create a group
        group_name = "Test Group"
        result = self.runner.invoke(manage.creategroup, [group_name], prog_name="aleph")
        assert result.exit_code == 0

        # Remove a nonexistent user from the group
        email = "nonexistent@example.com"
        result = self.runner.invoke(
            manage.userdel,
            [group_name, email],
            prog_name="aleph",
        )
        assert result.exit_code != 0
        assert isinstance(result.exception, SystemExit)

    def test_userdel_nonexistent_group(self):
        # Create a user
        email = "test@example.com"
        name = "Test User"
        result = self.runner.invoke(
            manage.createuser,
            [email, "--password", "letmein", "--name", name],
            prog_name="aleph",
        )
        assert result.exit_code == 0

        # Remove the user from a nonexistent group
        group_name = "nonexistent"
        result = self.runner.invoke(
            manage.userdel,
            [group_name, email],
            prog_name="aleph",
        )
        assert result.exit_code != 0
        assert isinstance(result.exception, SystemExit)
