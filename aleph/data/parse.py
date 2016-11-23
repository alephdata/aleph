import phonenumbers
from phonenumbers.phonenumberutil import NumberParseException

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