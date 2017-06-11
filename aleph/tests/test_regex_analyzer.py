import re
from aleph.model import Document
from aleph.tests.util import TestCase
from aleph.analyze.regex import PhoneNumberAnalyzer

PHONE_NUMBERS = [
    '754-3010',
    '(541) 754-3010',
    '+1-541-754-3010',
    '1-541-754-3010',
    '001-541-754-3010',
    '191 541 754 3010',
    '(089) / 636-48018',
    '+49-89-636-48018',
    '19-49-89-636-48018',
    'phone: +49-89-636-48018',
    'tel +49-89-636-48018 or so',
]


class PhoneNumberTestCase(TestCase):

    def setUp(self):
        super(PhoneNumberTestCase, self).setUp()
        self.regex = re.compile(PhoneNumberAnalyzer.REGEX, re.I)

    def test_regex_recognize(self):
        for number in PHONE_NUMBERS:
            matches = self.regex.findall(number)
            assert len(matches) == 1, (number, matches)

    def test_normalize(self):
        for number in PHONE_NUMBERS:
            document = Document()
            document.add_country('de')
            analyzer = PhoneNumberAnalyzer(document)
            analyzer.prepare()
            analyzer.on_text(number)
            analyzer.finalize()
            # assert meta.phone_numbers
