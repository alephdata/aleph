import re
import dateparser
import fingerprints
import countrynames
from datetime import datetime
from flanker.addresslib import address
import phonenumbers
from phonenumbers.phonenumberutil import NumberParseException

from memorious.util import clean_text


class StringProperty(object):
    index_invert = None

    def __init__(self):
        self.name = type(self).__name__.lower().replace('property', '')

    def clean(self, value, prop, record):
        return clean_text(value)

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
        return [fingerprints.generate(value)]


class URLProperty(StringProperty):
    index_invert = None


class DateProperty(StringProperty):
    index_invert = 'dates'

    def clean(self, value, prop, record):
        value = super(DateProperty, self).clean(value, prop, record)
        if value is None:
            return value
        date_format = prop.data.get('format')
        if date_format is not None:
            try:
                date = datetime.strptime(value, date_format)
                return date.date().isoformat()
            except:
                return value
        else:
            date = dateparser.parse(value)
            if date is not None:
                return date.date().isoformat()
        return value

    def normalize_value(self, value, prop, record):
        try:
            datetime.strptime(value, '%Y-%m-%d')
            return [value]
        except ValueError:
            return []


class CountryProperty(StringProperty):
    index_invert = 'countries'

    def clean(self, value, prop, record):
        value = super(CountryProperty, self).clean(value, prop, record)
        return countrynames.to_code(value) or value

    def normalize_value(self, value, prop, record):
        return [countrynames.to_code(value)]


class AddressProperty(StringProperty):
    index_invert = 'addresses'

    def normalize_value(self, value, prop, record):
        return [fingerprints.generate(value)]


class PhoneProperty(StringProperty):
    index_invert = 'phones'
    FORMAT = phonenumbers.PhoneNumberFormat.INTERNATIONAL

    def clean(self, value, prop, record):
        value = super(PhoneProperty, self).clean(value, prop, record)
        if value is None:
            return
        try:
            country = prop.data.get('country')
            num = phonenumbers.parse(value, country)
            if phonenumbers.is_possible_number(num):
                # if phonenumbers.is_valid_number(num):
                num = phonenumbers.format_number(num, self.FORMAT)
                return num.replace(' ', '')
        except NumberParseException:
            pass
        return value


class EmailProperty(StringProperty):
    index_invert = 'emails'

    def clean(self, value, prop, record):
        value = super(EmailProperty, self).clean(value, prop, record)
        if value is None:
            return
        parsed = address.parse(value)
        if parsed is not None:
            return parsed.address
        return value

    def normalize_value(self, value, prop, record):
        parsed = address.parse(value)
        if parsed is not None:
            return [parsed.address]
        return []


class IdentiferProperty(StringProperty):
    index_invert = 'fingerprints'
    clean_re = re.compile('[^a-zA-Z0-9]*')

    def normalize_value(self, value, prop, record):
        value = self.clean_re.sub('', value).upper()
        if not len(value):
            return []
        return [value]


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
