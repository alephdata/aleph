import phonenumbers
from phonenumbers import geocoder
from schwifty import IBAN
from ipaddress import ip_address
from normality import normalize, collapse_spaces
from fingerprints import clean_entity_name
from alephclient.services.entityextract_pb2 import ExtractedEntity

from entityextractor.location import LocationResolver

MAX_LENGTH = 100
MIN_LENGTH = 4


class Result(object):
    strict = True

    def __init__(self, ctx, label, start, end):
        self.ctx = ctx
        self.label = label
        self.key = label
        self.start = start
        self.end = end
        self.span = (ctx.record, start, end)
        self.countries = []
        self.valid = True

    @classmethod
    def clean_name(cls, text):
        if text is None or len(text) > MAX_LENGTH:
            return
        text = clean_entity_name(text)
        text = collapse_spaces(text)
        if not len(text) or len(text) < MIN_LENGTH:
            return
        return text

    @classmethod
    def label_key(cls, label):
        return normalize(label, ascii=True)

    def __str__(self):
        return self.label


class NamedResult(Result):
    """Any entity extracted that has a human-style name."""
    strict = False

    def __init__(self, ctx, label, start, end):
        label = self.clean_name(label)
        super(NamedResult, self).__init__(ctx, label, start, end)
        self.key = self.label_key(self.label)
        self.valid = self.key is not None


class OrganizationResult(NamedResult):
    category = ExtractedEntity.ORGANIZATION

    def __init__(self, ctx, label, start, end):
        super(OrganizationResult, self).__init__(ctx, label, start, end)
        if self.valid and ' ' not in self.label:
            self.valid = False


class PersonResult(NamedResult):
    category = ExtractedEntity.PERSON

    def __init__(self, ctx, label, start, end):
        super(PersonResult, self).__init__(ctx, label, start, end)
        if self.valid and ' ' not in self.label:
            self.valid = False


class LocationResult(NamedResult):
    """Locations are being mapped to countries."""
    resolver = LocationResolver()
    category = ExtractedEntity.LOCATION

    def __init__(self, ctx, label, start, end):
        super(LocationResult, self).__init__(ctx, label, start, end)
        self.countries = self.resolver.get_countries(label)


class LanguageResult(Result):
    category = ExtractedEntity.LANGUAGE

    def __init__(self, ctx, label, start, end):
        label = label.strip().lower()
        super(LanguageResult, self).__init__(ctx, label, start, end)


class IPAddressResult(Result):
    """Pull IPv4, IPv6 - and validate using on-board Python tools."""
    category = ExtractedEntity.IPADDRESS

    def __init__(self, ctx, label, start, end):
        super(IPAddressResult, self).__init__(ctx, label, start, end)
        try:
            ip = ip_address(label)
            self.key = self.label = str(ip)
        except ValueError:
            self.valid = False


class EmailResult(Result):
    category = ExtractedEntity.EMAIL

    def __init__(self, ctx, label, start, end):
        super(EmailResult, self).__init__(ctx, label, start, end)
        self.key = self.label_key(self.label)
        self.valid = self.key is not None
        # TODO: do we want to do TLD -> country?


class PhoneResult(Result):
    FORMAT = phonenumbers.PhoneNumberFormat.E164
    category = ExtractedEntity.PHONE

    def __init__(self, ctx, label, start, end):
        super(PhoneResult, self).__init__(ctx, label, start, end)
        number = self._parse(label)
        for country in ctx.countries:
            if number is None:
                number = self._parse(label, country)
        self.valid = number is not None
        if number is not None:
            self.countries = [geocoder.region_code_for_number(number)]
            self.label = phonenumbers.format_number(number, self.FORMAT)
            self.key = self.label

    def _parse(self, number, region=None):
        try:
            num = phonenumbers.parse(number, region)
            if phonenumbers.is_possible_number(num):
                if phonenumbers.is_valid_number(num):
                    return num
        except phonenumbers.NumberParseException:
            pass


class IBANResult(Result):
    category = ExtractedEntity.IBAN

    def __init__(self, ctx, label, start, end):
        super(IBANResult, self).__init__(ctx, label, start, end)
        try:
            iban = IBAN(label)
            self.key = self.label = iban.compact
            self.countries = [iban.country_code]
        except ValueError:
            self.valid = False
