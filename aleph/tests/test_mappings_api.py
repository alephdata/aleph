import logging

from followthemoney import model
from followthemoney.proxy import EntityProxy

from aleph.core import archive, db
from aleph.model import Mapping
from aleph.index.entities import index_proxy
from aleph.views.util import validate
from aleph.tests.util import TestCase

log = logging.getLogger(__name__)


class MappingAPITest(TestCase):
    def setUp(self):
        super(MappingAPITest, self).setUp()

        self.role, self.headers = self.login()
        self.col = self.create_collection(creator=self.role)

        self.role_other, self.headers_other = self.login(foreign_id="other")
        self.col_other = self.create_collection(creator=self.role_other)

        self.role_read, self.headers_read = self.login(foreign_id="read_only")
        self.grant(collection=self.col, role=self.role_read, read=True, write=False)

        fixture = self.get_fixture_path("experts.csv")
        self.content_hash = archive.archive_file(fixture)

    def create_table_entity(self, collection, entity_id):
        """Create a table entitiy to use as the mapping source."""
        data = {
            "id": entity_id,
            "schema": "Table",
            "properties": {
                "csvHash": self.content_hash,
                "contentHash": self.content_hash,
                "mimeType": "text/csv",
                "fileName": "experts.csv",
                "name": "experts.csv",
            },
        }

        table = EntityProxy.from_dict(model, data, cleaned=False)
        table.id = collection.ns.sign(table.id)
        index_proxy(collection=collection, proxy=table)

        return table

    def create_mapping(self, collection, table, role):
        query = {
            "person": {
                "schema": "Person",
                "keys": ["name", "nationality"],
                "properties": {
                    "name": {"column": "name"},
                    "nationality": {"column": "nationality"},
                },
            }
        }

        mapping = Mapping.create(
            query=query,
            table_id=table.id,
            collection=collection,
            role_id=role.id,
        )
        db.session.commit()

        return mapping

    def test_mappings_index(self):
        table = self.create_table_entity(
            collection=self.col,
            entity_id="foo",
        )
        mapping = self.create_mapping(
            collection=self.col,
            table=table,
            role=self.role,
        )

        table_other = self.create_table_entity(
            collection=self.col_other,
            entity_id="bar",
        )
        mapping_other = self.create_mapping(
            collection=self.col_other,
            table=table_other,
            role=self.role_other,
        )

        url = f"/api/2/collections/{self.col.id}/mappings"

        res = self.client.get(url, headers=self.headers_other)
        assert res.status_code == 403

        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200

        validate(res.json, "QueryResponse")
        assert res.json["total"] == 1
        assert len(res.json["results"]) == 1
        assert res.json["results"][0]["id"] == str(mapping.id)
        assert res.json["results"][0]["table_id"] == table.id
        assert res.json["results"][0]["collection_id"] == str(self.col.id)

        # Mapping can be viewed by users with read-only access
        res = self.client.get(url, headers=self.headers_read)
        assert res.status_code == 200
        assert len(res.json["results"]) == 1
        assert res.json["results"][0]["id"] == str(mapping.id)

        # Only mappings for the given collection are returned
        url = f"/api/2/collections/{self.col_other.id}/mappings"
        res = self.client.get(url, headers=self.headers_other)
        assert res.status_code == 200
        assert len(res.json["results"]) == 1
        assert res.json["results"][0]["id"] == str(mapping_other.id)

    def test_mappings_index_filters(self):
        table_1 = self.create_table_entity(collection=self.col, entity_id="foo")
        mapping_1 = self.create_mapping(
            collection=self.col,
            table=table_1,
            role=self.role,
        )

        table_2 = self.create_table_entity(collection=self.col, entity_id="bar")
        mapping_2 = self.create_mapping(
            collection=self.col,
            table=table_2,
            role=self.role,
        )

        url = f"/api/2/collections/{self.col.id}/mappings"

        query_string = {"filter:table": table_1.id}
        res = self.client.get(url, headers=self.headers, query_string=query_string)
        assert res.status_code == 200
        validate(res.json, "QueryResponse")
        assert res.json["total"] == 1
        assert len(res.json["results"]) == 1
        assert res.json["results"][0]["id"] == str(mapping_1.id)
        assert res.json["results"][0]["table_id"] == table_1.id

        query_string = {"filter:table": table_2.id}
        res = self.client.get(url, headers=self.headers, query_string=query_string)
        assert res.json["total"] == 1
        assert res.json["results"][0]["id"] == str(mapping_2.id)
        assert res.json["results"][0]["table_id"] == table_2.id

    def test_mappings_view(self):
        table = self.create_table_entity(collection=self.col, entity_id="foo")
        mapping = self.create_mapping(collection=self.col, table=table, role=self.role)

        # Mapping and collection IDs have to match
        url = f"/api/2/collections/{self.col_other.id}/mappings/{mapping.id}"
        res = self.client.get(url, headers=self.headers_other)
        assert res.status_code == 404

        url = f"/api/2/collections/{self.col.id}/mappings/{mapping.id}"

        # Only users with access to the collection can view mappings
        res = self.client.get(url, headers=self.headers_other)
        assert res.status_code == 403

        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200

        validate(res.json, "Mapping")
        assert res.json["id"] == str(mapping.id)
        assert res.json["collection_id"] == str(self.col.id)
        assert res.json["table_id"] == table.id
        assert res.json["table"]["schema"] == "Table"
        assert res.json["table"]["properties"]["fileName"] == ["experts.csv"]

        # Mappings cannot be viewed by users with read-only access.
        # This doesn't make a whole lot of sense but it reflects the current implementation.
        res = self.client.get(url, headers=self.headers_read)
        assert res.status_code == 403

    def test_mappings_create(self):
        table = self.create_table_entity(collection=self.col, entity_id="foo")

        url = f"/api/2/collections/{self.col.id}/mappings"

        data = {
            "table_id": table.id,
            "mapping_query": {
                "person": {
                    "schema": "Person",
                    "keys": ["name", "nationality"],
                    "properties": {
                        "name": {"column": "name"},
                        "nationality": {"column": "nationality"},
                    },
                }
            },
        }

        # Mappings can only be created by users with access to the collection
        res = self.client.post(url, json=data, headers=self.headers_other)
        assert res.status_code == 403

        # Read access is not enough to create a mapping
        res = self.client.post(url, json=data, headers=self.headers_read)
        assert res.status_code == 403

        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 200

        validate(res.json, "Mapping")
        mapping_id = res.json["id"]

        res = self.client.get(url, headers=self.headers)
        assert len(res.json["results"]) == 1
        assert res.json["results"][0]["id"] == mapping_id

    def test_mappings_trigger(self):
        table = self.create_table_entity(self.col, entity_id="foo")
        mapping = self.create_mapping(self.col, table=table, role=self.role)

        # There are no entities before running the mapping
        entities_url = "/api/2/entities"
        entities_query_string = {
            "filter:collection_id": self.col.id,
            "filter:schemata": "Person",
        }

        res = self.client.get(
            entities_url,
            query_string=entities_query_string,
            headers=self.headers,
        )
        assert res.json["total"] == 0

        # Mapping and collection IDs have to match
        trigger_url = (
            f"/api/2/collections/{self.col_other.id}/mappings/{mapping.id}/trigger"
        )
        res = self.client.post(trigger_url, headers=self.headers_other)
        assert res.status_code == 404

        # Trigger the mapping to generate entities
        trigger_url = f"/api/2/collections/{self.col.id}/mappings/{mapping.id}/trigger"

        # Only users with access to the collection can trigger mappings
        res = self.client.post(trigger_url, headers=self.headers_other)
        assert res.status_code == 403

        # Read access is not enough to trigger a mapping
        res = self.client.post(trigger_url, headers=self.headers_read)
        assert res.status_code == 403

        res = self.client.post(trigger_url, headers=self.headers)
        assert res.status_code == 202

        view_url = f"/api/2/collections/{self.col.id}/mappings/{mapping.id}"
        res = self.client.get(view_url, headers=self.headers)
        assert res.json["last_run_status"] == "successful"
        assert "last_run_err_msg" not in res.json

        # 14 entities have been generated after triggering the mapping
        res = self.client.get(
            entities_url,
            query_string=entities_query_string,
            headers=self.headers,
        )
        assert len(res.json["results"]) == 14
        assert res.json["results"][0]["schema"] == "Person"
        assert res.json["results"][0]["properties"]["proof"][0]["id"] == table.id

    def test_mappings_flush(self):
        table = self.create_table_entity(collection=self.col, entity_id="foo")
        mapping = self.create_mapping(collection=self.col, table=table, role=self.role)

        # Trigger mapping to generate entities
        trigger_url = f"/api/2/collections/{self.col.id}/mappings/{mapping.id}/trigger"
        res = self.client.post(trigger_url, headers=self.headers)
        assert res.status_code == 202

        # Manually create an entity. Used later on to ensure that flushing a mapping
        # only deletes entities generated from the mapping.
        person = EntityProxy.from_dict(
            model,
            {
                "id": "john-doe",
                "schema": "Person",
                "properties": {
                    "name": ["John Doe"],
                },
            },
        )
        person.id = self.col.ns.sign(person.id)
        index_proxy(collection=self.col, proxy=person)

        entities_url = "/api/2/entities"
        entities_query_string = {
            "filter:schema": "Person",
            "filter:collection_id": self.col.id,
            "filter:origin": f"mapping:{mapping.id}",
        }

        res = self.client.get(
            entities_url,
            query_string=entities_query_string,
            headers=self.headers,
        )
        assert len(res.json["results"]) == 14

        # Mapping and collection IDs have to match
        flush_url = (
            f"/api/2/collections/{self.col_other.id}/mappings/{mapping.id}/flush"
        )
        res = self.client.post(flush_url, headers=self.headers_other)
        assert res.status_code == 404

        # Flush the mapping to delete generated entities
        flush_url = f"/api/2/collections/{self.col.id}/mappings/{mapping.id}/flush"

        # Only users with access to the collection can flush a mapping
        res = self.client.post(flush_url, headers=self.headers_other)
        assert res.status_code == 403

        # Read access is not enough to flush a collection
        res = self.client.post(flush_url, headers=self.headers_read)
        assert res.status_code == 403

        res = self.client.post(flush_url, headers=self.headers)
        assert res.status_code == 202

        # All entities except for the one manually generated entity have been deleted
        entities_query_string.pop("filter:origin")
        res = self.client.get(
            entities_url,
            query_string=entities_query_string,
            headers=self.headers,
        )
        assert len(res.json["results"]) == 1
        assert res.json["results"][0]["id"] == person.id

    def test_mappings_update(self):
        table = self.create_table_entity(collection=self.col, entity_id="foo")
        mapping = self.create_mapping(collection=self.col, table=table, role=self.role)

        url = f"/api/2/collections/{self.col.id}/mappings/{mapping.id}"
        trigger_url = f"/api/2/collections/{self.col.id}/mappings/{mapping.id}/trigger"

        # Trigger mapping to generate entities
        res = self.client.post(trigger_url, headers=self.headers)
        assert res.status_code == 202

        entities_url = "/api/2/entities"
        entities_query_string = {
            "filter:schema": "Person",
            "filter:collection_id": self.col.id,
        }

        res = self.client.get(
            entities_url,
            query_string=entities_query_string,
            headers=self.headers,
        )
        assert len(res.json["results"]) == 14
        assert set(res.json["results"][0]["properties"].keys()) == {
            "name",
            "nationality",
            "proof",
        }

        new_query = {
            "person": {
                "schema": "Person",
                "keys": ["name", "nationality"],
                "properties": {
                    "name": {"column": "name"},
                    "nationality": {"column": "nationality"},
                    # The following column mapping is new
                    "gender": {"column": "gender"},
                },
            }
        }
        data = {"table_id": table.id, "mapping_query": new_query}

        # Mapping and collection IDs have to match
        url = f"/api/2/collections/{self.col_other.id}/mappings/{mapping.id}"
        res = self.client.post(url, json=data, headers=self.headers_other)
        assert res.status_code == 404

        # Update the mapping
        url = f"/api/2/collections/{self.col.id}/mappings/{mapping.id}"

        # Only users with access to the collection can update mappings
        res = self.client.post(url, json=data, headers=self.headers_other)
        assert res.status_code == 403

        # Read access is not enough to update a mapping
        res = self.client.post(url, json=data, headers=self.headers_read)
        assert res.status_code == 403

        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 200

        validate(res.json, "Mapping")
        assert res.json["table_id"] == table.id
        assert res.json["collection_id"] == str(self.col.id)
        assert res.json["query"]["person"]["properties"]["gender"] == {
            "column": "gender"
        }

        # Trigger mapping to re-generate entities
        res = self.client.post(trigger_url, headers=self.headers)
        assert res.status_code == 202

        # The mapped entities now include the new property
        res = self.client.get(
            entities_url,
            query_string=entities_query_string,
            headers=self.headers,
        )
        assert len(res.json["results"]) == 14
        assert set(res.json["results"][0]["properties"].keys()) == {
            "name",
            "nationality",
            "gender",
            "proof",
        }

    def test_mappings_delete(self):
        table = self.create_table_entity(collection=self.col, entity_id="foo")
        mapping = self.create_mapping(collection=self.col, table=table, role=self.role)

        # Trigger the mapping to generate entities. We want to test that deleting a mapping
        # deletes associated entities, so we need to have some entities in the first place!
        trigger_url = f"/api/2/collections/{self.col.id}/mappings/{mapping.id}/trigger"
        res = self.client.post(trigger_url, headers=self.headers)
        assert res.status_code == 202

        entities_url = "/api/2/entities"
        entities_query_string = {
            "filter:schema": "Person",
            "filter:collection_id": self.col.id,
        }

        res = self.client.get(
            entities_url,
            query_string=entities_query_string,
            headers=self.headers,
        )
        assert res.json["total"] == 14
        assert len(res.json["results"]) == 14

        # Mapping and collection IDs have to match
        url = f"/api/2/collections/{self.col_other.id}/mappings/{mapping.id}"
        res = self.client.delete(url, headers=self.headers_other)
        assert res.status_code == 404

        # Delete the mapping
        url = f"/api/2/collections/{self.col.id}/mappings/{mapping.id}"

        # Only users with access to the collection can delete mappings
        res = self.client.delete(url, headers=self.headers_other)
        assert res.status_code == 403

        # Read access is not enough to delete mappings
        res = self.client.delete(url, headers=self.headers_read)
        assert res.status_code == 403

        res = self.client.delete(url, headers=self.headers)
        assert res.status_code == 204

        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 404

        # Deleting a mapping also deletes any entities generated from the mapping
        res = self.client.get(
            entities_url,
            query_string=entities_query_string,
            headers=self.headers,
        )
        assert res.json["total"] == 0
        assert len(res.json["results"]) == 0

    def test_mappings_create_update_valid_table(self):
        table = self.create_table_entity(collection=self.col, entity_id="foo")

        role_admin, headers_admin = self.login(foreign_id="admin", is_admin=True)
        col_admin = self.create_collection(creator=role_admin)
        table_admin = self.create_table_entity(collection=col_admin, entity_id="bar")

        data = {
            "mapping_query": {
                "person": {
                    "schema": "Person",
                    "keys": ["name", "nationality"],
                    "properties": {
                        "name": {"column": "name"},
                        "nationality": {"column": "nationality"},
                    },
                }
            },
        }

        url = f"/api/2/collections/{self.col.id}/mappings"

        data["table_id"] = table_admin.id

        # Role does not have access to table
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 403

        # Role has access to table, but table is not part of the collection
        res = self.client.post(url, json=data, headers=headers_admin)
        assert res.status_code == 400

        # Create a mapping with a table that is part of the collection
        data["table_id"] = table.id
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 200
        mapping_id = res.json["id"]

        # Update mapping
        url = f"/api/2/collections/{self.col.id}/mappings/{mapping_id}"
        data["table_id"] = table_admin.id

        # Role does not have access to table
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 403

        # Role has access to table and collection, but table is not part of the collection
        res = self.client.post(url, json=data, headers=headers_admin)
        assert res.status_code == 400

        # Update the mapping with a table that is part of the collection
        data["table_id"] = table.id
        res = self.client.post(url, json=data, headers=self.headers)
