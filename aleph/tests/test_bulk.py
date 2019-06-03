import os
from unittest import skip  # noqa
from alephclient.util import load_config_file

from aleph.logic.bulkload import bulk_load
from aleph.queues import get_queue, OP_BULKLOAD
from aleph.worker import sync_worker
from aleph.tests.util import TestCase


class BulkLoadTestCase(TestCase):

    def setUp(self):
        super(BulkLoadTestCase, self).setUp()
        self.coll = self.create_collection()
        self.queue = get_queue(self.coll, OP_BULKLOAD)

    def test_load_sqlite(self):
        db_uri = 'sqlite:///' + self.get_fixture_path('kek.sqlite')
        os.environ['ALEPH_TEST_BULK_DATABASE_URI'] = db_uri
        yml_path = self.get_fixture_path('kek.yml')
        config = load_config_file(yml_path)
        bulk_load(self.queue, self.coll, config.get('kek'))
        sync_worker()

        _, headers = self.login(is_admin=True)
        url = '/api/2/entities?filter:schemata=Thing&q=friede+springer'
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        res0 = res.json['results'][0]
        name = 'Springer, Friede'
        assert res0['name'].startswith(name), res0

    def test_load_csv(self):
        db_uri = 'file://' + self.get_fixture_path('experts.csv')
        os.environ['ALEPH_TEST_BULK_CSV'] = db_uri
        yml_path = self.get_fixture_path('experts.yml')
        config = load_config_file(yml_path)
        bulk_load(self.queue, self.coll, config.get('experts'))
        sync_worker()

        _, headers = self.login(is_admin=True)
        url = '/api/2/entities?filter:schemata=Thing&q=Greenfield'
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
