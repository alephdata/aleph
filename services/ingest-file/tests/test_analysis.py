from followthemoney import model
from followthemoney.types import registry

from ingestors.analysis import analyze_entity
from ingestors.analysis.patterns import EMAIL_REGEX, PHONE_REGEX
from ingestors.analysis.patterns import IBAN_REGEX

from .support import TestCase


class TestAnalysis(TestCase):

    def test_ner_extract(self):
        text = 'Das ist der Pudel von Angela Merkel. '
        text = text * 5
        entity = model.make_entity('PlainText')
        entity.add('bodyText', text)
        analyze_entity(entity)
        names = entity.get_type_values(registry.name)
        assert 'Angela Merkel' in names, names

    def test_language_tagging(self):
        text = "C'est le caniche d'Emmanuel Macron. " * 2
        entity = model.make_entity('PlainText')
        entity.add('bodyText', text)
        analyze_entity(entity)
        names = entity.get_type_values(registry.name)
        assert "Emmanuel Macron" in names, names
        assert entity.get('detectedLanguage') == ['fra'], entity.get('detectedLanguage')  # noqa

    def test_pattern_extract(self):
        text = "Mr. Flubby Flubber called the number tel:+919988111222 twice"
        entity = model.make_entity('PlainText')
        entity.add('bodyText', text)
        analyze_entity(entity)
        phones = entity.get_type_values(registry.phone)
        assert '+919988111222' in phones
        countries = entity.get_type_values(registry.country)
        assert 'in' in countries


class TestPatterns(TestCase):

    def test_phonenumbers(self):
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
        for number in PHONE_NUMBERS:
            matches = PHONE_REGEX.findall(number)
            assert len(matches) == 1

    def test_iban(self):
        IBANS = [
            'SC52BAHL01031234567890123456USD',
            'SK8975000000000012345671',
            'SI56192001234567892',
            'ES7921000813610123456789',
            'SE1412345678901234567890',
            'CH5604835012345678009',
            'TL380080012345678910157',
            'TN4401000067123456789123',
            'TR320010009999901234567890',
            'UA903052992990004149123456789',
            'AE460090000000123456789',
            'GB98MIDL07009312345678',
            'VG21PACG0000000123456789',
        ]
        for iban in IBANS:
            matches = IBAN_REGEX.findall(iban)
            assert len(matches) == 1

    def test_email(self):
        EMAILS = [
            "abc@sunu.in",
            "abc+netflix@sunu.in",
            "_@sunu.in"
        ]
        for email in EMAILS:
            matches = EMAIL_REGEX.findall(email)
            assert len(matches) == 1
