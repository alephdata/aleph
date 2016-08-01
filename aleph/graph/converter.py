import logging
from datetime import datetime, date
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


class Property(object):
    # Can apply either to a node or an edge.

    TRANSFORMS = {
        'fingerprint': fingerprint,
        'addressfp': addressfp,
        'lowercase': lowercase,
        'email': email,
        'phone': phone,
        'trim': trim
    }

    def __init__(self, item, name, config):
        self.item = item
        self.name = name
        self.column = config.get('column')
        self.literal = config.get('literal')
        self.format = config.get('format')
        self.nulls = config.get('nulls', [])
        self.country = config.get('country')
        self.transforms = config.get('transforms', [])
        if config.get('transform'):
            self.transforms.append(config.get('transform'))

    def bind(self, row):
        value = row.get(self.column, self.literal)
        if self.format is not None:
            value = self.format % row
        if value in self.nulls:
            return None
        if value is None:
            return self.literal
        for transform in self.transforms:
            if transform not in self.TRANSFORMS:
                log.warning("No such transformer: %r", transform)
                continue
            value = self.TRANSFORMS[transform](value, row=row, prop=self)
            if value is None:
                return
        if isinstance(value, datetime):
            value = value.date()
        if isinstance(value, date):
            value = value.isoformat()
        return value
