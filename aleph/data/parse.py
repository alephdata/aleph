import urlnorm
import dateparser
import countrynames
import phonenumbers
from urlparse import urlparse
from datetime import date, datetime
from urlparse import urldefrag
from phonenumbers.phonenumberutil import NumberParseException
from flanker.addresslib import address

from aleph.text import string_value
from aleph.data.validate import is_country_code, is_domain, is_partial_date

PHONE_FORMAT = phonenumbers.PhoneNumberFormat.INTERNATIONAL


def parse_phone(number, country=None):
    """Parse a phone number and return in international format.

    If no valid phone number can be detected, None is returned. If
    a country code is supplied, this will be used to infer the
    prefix.

    https://github.com/daviddrysdale/python-phonenumbers
    """
    number = string_value(number)
    if number is None:
        return
    if country is not None:
        country = country.upper()
    try:
        num = phonenumbers.parse(number, country)
        if phonenumbers.is_possible_number(num):
            if phonenumbers.is_valid_number(num):
                num = phonenumbers.format_number(num, PHONE_FORMAT)
                return num.replace(' ', '')
        return
    except phonenumbers.phonenumberutil.NumberParseException:
        return


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


def parse_domain(text):
    """Extract a domain name from a piece of text."""
    domain = string_value(text)
    if domain is not None:
        try:
            domain = urlparse(domain).hostname or domain
        except ValueError:
            pass
        if '@' in domain:
            _, domain = domain.rsplit('@', 1)
        domain = domain.lower()
        if domain.startswith('www.'):
            domain = domain[len('www.'):]
        domain = domain.strip('.')
        if is_domain(domain):
            return domain


def parse_date(text, guess=True, date_format=None):
    """The classic: date parsing, every which way."""
    # handle date/datetime before converting to text.
    if isinstance(text, datetime):
        text = text.date()
    if isinstance(text, date):
        return text.isoformat()

    text = string_value(text)
    if text is None:
        return

    elif date_format is not None:
        # parse with a specified format
        try:
            obj = datetime.strptime(text, date_format)
            return obj.date().isoformat()
        except:
            pass
    elif guess and not is_partial_date(text):
        # use dateparser to guess the format
        try:
            obj = dateparser.parse(text)
            return obj.date().isoformat()
        except Exception:
            pass
    else:
        # limit to the date part of a presumed date string
        text = text[:10]

    if is_partial_date(text):
        return text
