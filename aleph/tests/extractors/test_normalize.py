from aleph.tests.util import TestCase

from aleph.logic.extractors.result import NamedResult


class TestNormalize(TestCase):

    def test_clean_name(self):
        assert NamedResult.clean_name('  ') is None
        assert NamedResult.clean_name(None) is None
        assert NamedResult.clean_name('xx') is None  # too short
        assert NamedResult.clean_name('Mr. Clean and Proper') == 'Clean and Proper'
        assert NamedResult.clean_name('The') is None  # single token
        assert NamedResult.clean_name('The Thing Bling') == 'Thing Bling'
        assert NamedResult.clean_name('of The Thing Bling') == 'Thing Bling'
