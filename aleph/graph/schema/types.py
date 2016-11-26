import re

from aleph.text import string_value, collapse_spaces
from aleph.data.validate import is_partial_date
from aleph.data.parse import parse_phone, parse_country, parse_email
from aleph.data.parse import parse_date
from aleph.data.keys import make_fingerprint


class StringProperty(object):
    index_invert = None

    def __init__(self):
        self.name = type(self).__name__.lower().replace('property', '')

    def clean(self, value, prop, record):
        value = string_value(value)
        if value is not None:
            return collapse_spaces(value)

    def normalize(self, values, prop, record):
        results = []
        for value in values:
            for value in self.normalize_value(value, prop, record):
                if value is not None:
                    results.append(value)
        return set(results)

    def normalize_value(self, value, prop, record):
        return [self.clean(value, prop, record)]


class NameProperty(StringProperty):
    index_invert = 'fingerprints'

    def normalize_value(self, value, prop, record):
        return [make_fingerprint(value)]


class URLProperty(StringProperty):
    index_invert = None


class DateProperty(StringProperty):
    index_invert = 'dates'

    def clean(self, value, prop, record):
        value = super(DateProperty, self).clean(value, prop, record)
        return parse_date(value, date_format=prop.data.get('format'))

    def normalize_value(self, value, prop, record):
        if is_partial_date(value):
            return [value]
        return []


class CountryProperty(StringProperty):
    index_invert = 'countries'

    def clean(self, value, prop, record):
        value = super(CountryProperty, self).clean(value, prop, record)
        return parse_country(value) or value

    def normalize_value(self, value, prop, record):
        return [parse_country(value)]


class AddressProperty(StringProperty):
    index_invert = 'addresses'

    def normalize_value(self, value, prop, record):
        return [make_fingerprint(value)]


class PhoneProperty(StringProperty):
    index_invert = 'phones'

    def clean(self, value, prop, record):
        value = super(PhoneProperty, self).clean(value, prop, record)
        number = parse_phone(value, prop.data.get('country'))
        return number or value


class EmailProperty(StringProperty):
    index_invert = 'emails'

    def clean(self, value, prop, record):
        value = super(EmailProperty, self).clean(value, prop, record)
        return parse_email(value) or value

    def normalize_value(self, value, prop, record):
        email = parse_email(value)
        return [email] if email is not None else []


class IdentiferProperty(StringProperty):
    index_invert = 'fingerprints'
    clean_re = re.compile('[^a-zA-Z0-9]*')

    def normalize_value(self, value, prop, record):
        value = self.clean_re.sub('', value).upper()
        return [value] if len(value) else []


def resolve_type(name):
    """Look up a property type by name."""
    types = {
        'string': StringProperty,
        'name': NameProperty,
        'date': DateProperty,
        'country': CountryProperty,
        'address': AddressProperty,
        'phone': PhoneProperty,
        'email': EmailProperty,
        'url': URLProperty,
        'uri': URLProperty,
        'identifier': IdentiferProperty
    }
    type_ = types.get(name.strip().lower())
    if type_ is None:
        raise TypeError("No such type: %s" % name)
    return type_
