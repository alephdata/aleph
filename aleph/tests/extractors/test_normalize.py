from aleph.tests.util import TestCase

from aleph.logic.extractors.result import NameResult


class TestNormalize(TestCase):

    def test_clean_name(self):
        assert NameResult.clean_name('  ') is None
        assert NameResult.clean_name(None) is None
        assert NameResult.clean_name('xx') is None  # too short
        assert NameResult.clean_name('Mr. Clean and Proper') == 'Clean and Proper'  # noqa
        assert NameResult.clean_name('The') is None  # single token
        assert NameResult.clean_name('The Thing Bling') == 'Thing Bling'
        assert NameResult.clean_name('of The Thing Bling') == 'Thing Bling'
