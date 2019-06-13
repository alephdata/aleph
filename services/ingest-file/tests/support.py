from __future__ import absolute_import

import unittest
import types
import pathlib

from servicelayer.cache import get_fakeredis
from servicelayer.archive import init_archive
from servicelayer.process import ServiceQueue
from servicelayer import settings
from ingestors.manager import Manager

# Force tests to use fake-redis
settings.REDIS_URL = None


def emit_entity(self, entity, fragment=None):
    self.entities.append(entity)
    self.writer.put(entity.to_dict(), fragment=fragment)


class TestCase(unittest.TestCase):
    queue = ServiceQueue(get_fakeredis(), ServiceQueue.OP_INGEST, 'test')
    manager = Manager(queue, {})
    manager.entities = []
    manager.emit_entity = types.MethodType(emit_entity, manager)
    archive = init_archive(archive_type='file', path='build/test/archive')

    def fixture(self, fixture_path):
        """Returns a fixture path and a dummy entity"""
        # clear out entities
        self.manager.entities = []
        self.manager.dataset.delete()
        cur_path = pathlib.Path(__file__).parent
        cur_path = cur_path.joinpath('fixtures')
        path = cur_path.joinpath(fixture_path)
        entity = self.manager.make_entity('Document')
        if path.is_file():
            checksum = self.archive.archive_file(path)
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
