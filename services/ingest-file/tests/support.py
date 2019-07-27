from __future__ import absolute_import

import types
import unittest
from tempfile import mkdtemp

from servicelayer.cache import get_fakeredis
from servicelayer.archive import init_archive
from servicelayer.jobs import Job, Stage
from servicelayer.archive.util import ensure_path
from servicelayer import settings as service_settings
from balkhash import settings as balkhash_settings
from ingestors.manager import Manager


def emit_entity(self, entity, fragment=None):
    self.entities.append(entity)
    self.writer.put(entity.to_dict(), fragment=fragment)


def queue_entity(self, entity):
    self.ingest_entity(entity)


class TestCase(unittest.TestCase):

    def setUp(self):
        # Force tests to use fake configuration
        service_settings.REDIS_URL = None
        service_settings.ARCHIVE_TYPE = 'file'
        service_settings.ARCHIVE_PATH = mkdtemp()
        balkhash_settings.BACKEND = 'LEVELDB'
        balkhash_settings.LEVELDB_PATH = mkdtemp()
        conn = get_fakeredis()
        job = Job.create(conn, 'test')
        stage = Stage(job, Stage.INGEST)
        self.manager = Manager(stage, {})
        self.manager.entities = []
        self.manager.emit_entity = types.MethodType(emit_entity, self.manager)
        self.manager.queue_entity = types.MethodType(queue_entity, self.manager)  # noqa
        self.archive = init_archive()
        self.manager._archive = self.archive

    def fixture(self, fixture_path):
        """Returns a fixture path and a dummy entity"""
        # clear out entities
        self.manager.entities = []
        self.manager.dataset.delete()
        cur_path = ensure_path(__file__).parent
        cur_path = cur_path.joinpath('fixtures')
        path = cur_path.joinpath(fixture_path)
        entity = self.manager.make_entity('Document')
        if path.is_file():
            checksum = self.manager.store(path)
            entity.make_id(path.name, checksum)
            entity.set('contentHash', checksum)
            entity.set('fileSize', path.stat().st_size)
            entity.set('fileName', path.name)
        else:
            entity.make_id(fixture_path)
        return path, entity

    def get_emitted(self, schema=None):
        entities = list(self.manager.dataset.iterate())
        if schema is not None:
            entities = [e for e in entities if e.schema.is_a(schema)]
        return entities

    def get_emitted_by_id(self, id):
        return self.manager.dataset.get(id)

    def assertSuccess(self, entity):
        self.assertEqual(entity.first('processingStatus'),
                         self.manager.STATUS_SUCCESS)
