import re
from normality import stringify, collapse_spaces
from dalet import is_partial_date, parse_date
from dalet import parse_phone, parse_country, parse_email

from aleph.util import ensure_list


class StringProperty(object):
    index_invert = None

    def __init__(self):
        self.name = type(self).__name__.lower().replace('property', '')

    def clean(self, value, record, config):
        value = stringify(value)
        if value is not None:
            return collapse_spaces(value)

    def normalize(self, values):
        results = set()
        for value in values:
            results.update(ensure_list(self.normalize_value(value)))
        return results

    def normalize_value(self, value):
        return self.clean(value, {}, {})


class NameProperty(StringProperty):
    index_invert = 'names'

    def normalize_value(self, value):
        return collapse_spaces(value)


class URLProperty(StringProperty):
    index_invert = None


class DateProperty(StringProperty):
    index_invert = 'dates'

    def clean(self, value, record, config):
        value = super(DateProperty, self).clean(value, record, config)
        return parse_date(value, date_format=config.get('format'))

    def normalize_value(self, value):
        if is_partial_date(value):
            return value


class CountryProperty(StringProperty):
    index_invert = 'countries'

    def clean(self, value, record, config):
        value = super(CountryProperty, self).clean(value, record, config)
        return parse_country(value) or value

    def normalize_value(self, value):
        return parse_country(value)


class AddressProperty(StringProperty):
    index_invert = 'addresses'

    def normalize_value(self, value):
        return stringify(value)


class PhoneProperty(StringProperty):
    index_invert = 'phones'

    def clean(self, value, record, config):
        value = super(PhoneProperty, self).clean(value, record, config)
        number = parse_phone(value, config.get('country'))
        return number or value


class EmailProperty(StringProperty):
    index_invert = 'emails'

    def clean(self, value, record, config):
        value = super(EmailProperty, self).clean(value, record, config)
        return parse_email(value) or value

    def normalize_value(self, value):
        return parse_email(value)


class IdentiferProperty(StringProperty):
    index_invert = 'identifiers'
    clean_re = re.compile('[^a-zA-Z0-9]*')

    def normalize_value(self, value):
        value = stringify(value)
        if value is not None:
            value = self.clean_re.sub('', value).upper()
            return stringify(value)


def resolve_type(name):
    """Look up a configerty type by name."""
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
        'identifier': IdentiferProperty,
        'code': IdentiferProperty,
    }
    type_ = types.get(name.strip().lower())
    if type_ is None:
        raise TypeError("No such type: %s" % name)
    return type_
