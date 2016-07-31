import logging
import fingerprints
import phonenumbers
from flanker.addresslib import address

from aleph.text import string_value

log = logging.getLogger(__name__)


def fingerprint(value, **kwargs):
    return fingerprints.generate(string_value(value))


def trim(value, **kwargs):
    return string_value(value).strip()


def lowercase(value, **kwargs):
    return string_value(value).lower()


def addressfp(value, **kwargs):
    value = string_value(value)
    if value is None:
        return
    value = value.replace('<br/>', ' ')
    return fingerprints.generate(value, keep_order=True)


def email(value, **kwargs):
    parsed = address.parse(value)
    if parsed is None:
        return None
    return parsed.address


def phone(value, prop=None, **kwargs):
    try:
        value = string_value(value)
        if value is None:
            return
        num = phonenumbers.parse(value, prop.country)
        if phonenumbers.is_possible_number(num):
            return phonenumbers.format_number(num, phonenumbers.PhoneNumberFormat.INTERNATIONAL)  # noqa
    except Exception:
        return
