from aleph.tests.util import TestCase
from unittest import skip  # noqa

from aleph.core import db
from aleph.model import Cache


class CacheTestCase(TestCase):

    def setUp(self):
        super(CacheTestCase, self).setUp()

    def test_cache_basic(self):
        assert None is Cache.get_cache('foo'), Cache.get_cache('foo')
        assert db.session.query(Cache).count() == 0
        Cache.set_cache('foo', 'bar')
        assert 'bar' == Cache.get_cache('foo'), Cache.get_cache('foo')
        assert db.session.query(Cache).count() == 1
        Cache.set_cache('foo', 'quuux')
        assert 'quuux' == Cache.get_cache('foo'), Cache.get_cache('foo')
        assert db.session.query(Cache).count() == 1
