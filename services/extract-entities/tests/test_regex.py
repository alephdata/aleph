import pytest
from entityextractor.regex_patterns import (
    EMAIL_REGEX, IPV4_REGEX, IPV6_REGEX, PHONE_REGEX, IBAN_REGEX
)

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


IPV4_ADDRESSES = [
    "118.197.24.21",
    "0.0.0.0",
    "172.0.0.1"
]

IPV6_ADDRESSES = [
    "b239:181e:8f52:e4ee:ce42:c45c:6a03:4f14",
    "2001:db8:0:1234:0:567:8:1"
]


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


EMAILS = [
    "abc@sunu.in",
    "abc+netflix@sunu.in",
    "_@sunu.in"
]


@pytest.mark.parametrize('number', PHONE_NUMBERS)
def test_phonemuners(number):
    matches = PHONE_REGEX.findall(number)
    assert len(matches) == 1


@pytest.mark.parametrize('ip', IPV4_ADDRESSES)
def test_ipv4_address(ip):
    matches = IPV4_REGEX.findall(ip)
    assert len(matches) == 1


@pytest.mark.parametrize('ip', IPV6_ADDRESSES)
def test_ipv6_address(ip):
    matches = IPV6_REGEX.findall(ip)
    assert len(matches) == 1


@pytest.mark.parametrize('iban', IBANS)
def test_iban(iban):
    matches = IBAN_REGEX.findall(iban)
    assert len(matches) == 1


@pytest.mark.parametrize('email', EMAILS)
def test_email(email):
    matches = EMAIL_REGEX.findall(email)
    assert len(matches) == 1
