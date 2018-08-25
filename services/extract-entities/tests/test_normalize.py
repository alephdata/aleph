from entityextractor.result import Result


class TestNormalize(object):

    def test_clean_name(self):
        assert Result.clean_name('  ') is None
        assert Result.clean_name(None) is None
        assert Result.clean_name('xx') is None  # too short
        assert Result.clean_name('Mr. Clean and Proper') == 'Clean and Proper'
        assert Result.clean_name('The') is None  # single token
        assert Result.clean_name('The Thing Bling') == 'Thing Bling'
        assert Result.clean_name('of The Thing Bling') == 'Thing Bling'

    def test_label_key(self):
        assert Result.label_key('') is None
        assert Result.label_key('BANANA') == 'banana'
