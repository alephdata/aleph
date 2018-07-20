from entityextractor.normalize import clean_label, label_key


class TestNormalize(object):

    def test_clean_label(self):
        assert clean_label('  ') is None
        assert clean_label(None) is None
        assert clean_label('xx') is None  # too short
        assert clean_label('Mr. Clean and Proper') == 'Clean and Proper'
        assert clean_label('The Thing') is None  # single token
        assert clean_label('The Thing Bling') == 'Thing Bling'
        assert clean_label('of The Thing Bling') == 'Thing Bling'

    def test_label_key(self):
        assert label_key('') is None
        assert label_key('BANANA') == 'banana'
