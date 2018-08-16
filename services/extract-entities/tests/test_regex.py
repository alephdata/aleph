from entityextractor.extract import extract_regex

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


class TestPhoneNumbers(object):
    def test_regex_recognize(self):
        for number in PHONE_NUMBERS:
            matches = list(extract_regex(number))
            assert len(matches) == 1, (number, matches[0][0])
