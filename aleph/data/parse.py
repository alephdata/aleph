import countrynames
import phonenumbers
from phonenumbers.phonenumberutil import NumberParseException
from flanker.addresslib import address

from aleph.text import string_value
from aleph.data.validate import is_country_code

PHONE_FORMAT = phonenumbers.PhoneNumberFormat.INTERNATIONAL


def parse_phone(number, country=None):
    """Parse a phone number and return in international format.

    If no valid phone number can be detected, None is returned. If
    a country code is supplied, this will be used to infer the
    prefix.

    https://github.com/daviddrysdale/python-phonenumbers
    """
    if country is not None:
        country = country.upper()
    try:
        num = phonenumbers.parse(number, country)
        if phonenumbers.is_possible_number(num):
            if phonenumbers.is_valid_number(num):
                num = phonenumbers.format_number(num, PHONE_FORMAT)
                return num.replace(' ', '')
        return None
    except phonenumbers.phonenumberutil.NumberParseException:
        return None


def parse_country(country, guess=True):
    """Determine a two-letter country code based on an input.

    The input may be a country code, a country name, etc.
    """
    if guess:
        country = countrynames.to_code(country)
    if country is not None:
        country = country.lower()
        if is_country_code(country):
            return country


def parse_email(email):
    """Parse and normalize an email address.

    Returns None if this is not an email address.
    """
    if email is not None:
        parsed = address.parse(email)
        if parsed is not None:
            return parsed.address


def parse_url(text):
    """Clean and verify a URL."""
    # TODO: learn from https://github.com/hypothesis/h/blob/master/h/api/uri.py
    url = string_value(text)
    if url is not None:
        if url.startswith('//'):
            url = 'http:' + url
        elif '://' not in url:
            url = 'http://' + url
        try:
            norm = urlnorm.norm(url)
            norm, _ = urldefrag(norm)
            return norm
        except:
            return None
    return None
