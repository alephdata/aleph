from aleph.tests.util import TestCase
from aleph.logic.roles import create_group


class PermissionsApiTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.role, self.headers = self.login(
            foreign_id="john",
            name="John Doe",
            email="john.doe@example.org",
        )
        self.col = self.create_collection(creator=self.role)

    def test_update(self):
        jane = self.create_user(
            foreign_id="jane",
            name="Jane Doe",
            email="jane.doe@example.org",
        )

        url = f"/api/2/collections/{self.col.id}/permissions"
        res = self.client.get(url, headers=self.headers)
        assert len(res.json["results"]) == 1
        assert res.json["results"][0]["role"]["id"] == str(self.role.id)

        # Granting a new user access without providing their full email address is ignored
        data = [
            {"role_id": str(self.role.id), "read": True, "write": True},
            {"role_id": str(jane.id), "read": True, "write": False},
        ]
        res = self.client.put(url, headers=self.headers, json=data)
        assert res.status_code == 200
        assert len(res.json["results"]) == 1
        assert res.json["results"][0]["role"]["id"] == str(self.role.id)

        # Granting a new user accces with an incorrect email address is ignored
        data = [
            {
                "role_id": str(self.role.id),
                "read": True,
                "write": True,
            },
            {
                "role_id": str(jane.id),
                "email": "thisisnotjane@example.org",
                "read": True,
                "write": False,
            },
        ]
        res = self.client.put(url, headers=self.headers, json=data)
        assert res.status_code == 200
        assert len(res.json["results"]) == 1
        assert res.json["results"][0]["role"]["id"] == str(self.role.id)

        # Granting a new user access updates permissions if full email address is provided
        data = [
            {
                "role_id": str(self.role.id),
                "read": True,
                "write": False,
            },
            {
                "role_id": str(jane.id),
                "email": "jane.doe@example.org",
                "read": True,
                "write": False,
            },
        ]
        res = self.client.put(url, headers=self.headers, json=data)
        assert res.status_code == 200
        assert len(res.json["results"]) == 2
        assert res.json["results"][0]["role"]["id"] == str(self.role.id)
        assert res.json["results"][1]["role"]["id"] == str(jane.id)
        assert res.json["results"][1]["read"] is True
        assert res.json["results"][1]["write"] is False

    def test_update_groups(self):
        group = create_group("group")

        url = f"/api/2/collections/{self.col.id}/permissions"
        res = self.client.get(url, headers=self.headers)
        assert len(res.json["results"]) == 1
        assert res.json["results"][0]["role"]["id"] == str(self.role.id)

        # Updated permissions for a group the user is not a member of are ignored
        data = [
            {"role_id": str(self.role.id), "read": True, "write": True},
            {"role_id": str(group.id), "read": True, "write": False},
        ]
        res = self.client.put(url, headers=self.headers, json=data)
        assert res.status_code == 200
        assert len(res.json["results"]) == 1
        assert res.json["results"][0]["role"]["id"] == str(self.role.id)

        self.role.add_role(group)
        res = self.client.put(url, headers=self.headers, json=data)
        assert res.status_code == 200
        assert len(res.json["results"]) == 2
        assert res.json["results"][0]["role"]["id"] == str(self.role.id)
        assert res.json["results"][1]["role"]["id"] == str(group.id)
        assert res.json["results"][1]["read"] is True
        assert res.json["results"][1]["write"] is False
