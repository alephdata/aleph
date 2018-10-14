import logging
from banal import ensure_list
from normality import collapse_spaces
from fingerprints import clean_entity_name
from followthemoney.types import registry

from aleph.core import kv
from aleph.model import DocumentTag
from aleph.logic.extractors.util import normalize_label, place_key

log = logging.getLogger(__name__)


class Result(object):
    strict = True

    def __init__(self, ctx, label, start, end):
        self.ctx = ctx
        self.label = label
        self.key = normalize_label(label)
        self.span = (ctx.record, start, end)
        self.countries = []

    def __str__(self):
        return self.label

    def __repr__(self):
        return '<Result(%s,%s)>' % (self.label, self.category)


class NamedResult(Result):
    """Any entity extracted that has a human-style name."""
    strict = False
    MAX_LENGTH = 100
    MIN_LENGTH = 4

    def __init__(self, ctx, label, start, end):
        label = self.clean_name(label)
        super(NamedResult, self).__init__(ctx, label, start, end)
        if self.label is not None and ' ' not in self.label:
            self.key = None

    @classmethod
    def clean_name(self, text):
        if text is None or len(text) > self.MAX_LENGTH:
            return
        text = clean_entity_name(text)
        text = collapse_spaces(text)
        if len(text) < self.MIN_LENGTH:
            return
        return text


class OrganizationResult(NamedResult):
    category = DocumentTag.TYPE_ORGANIZATION


class PersonResult(NamedResult):
    category = DocumentTag.TYPE_PERSON


class LocationResult(Result):
    """Locations are being mapped to countries."""
    category = DocumentTag.TYPE_LOCATION

    def __init__(self, ctx, label, start, end):
        super(LocationResult, self).__init__(ctx, label, start, end)
        if self.key is not None:
            try:
                value = kv.lrange(place_key(self.key), 0, -1)
                self.countries = ensure_list(value)
            except KeyError:
                pass


class TypedResult(Result):
    type = None

    def __init__(self, ctx, label, start, end):
        args = dict(countries=ctx.countries)
        label = self.type.clean(label, **args)
        super(TypedResult, self).__init__(ctx, label, start, end)
        self.countries = ensure_list(self.type.country_hint(label))


class LanguageResult(TypedResult):
    category = DocumentTag.TYPE_LANGUAGE
    type = registry.language


class CountryResult(TypedResult):
    category = DocumentTag.TYPE_COUNTRY
    type = registry.country


class IPAddressResult(TypedResult):
    category = DocumentTag.TYPE_IP
    type = registry.ip


class EmailResult(TypedResult):
    category = DocumentTag.TYPE_EMAIL
    type = registry.email


class PhoneResult(TypedResult):
    category = DocumentTag.TYPE_PHONE
    type = registry.phone


class IBANResult(TypedResult):
    category = DocumentTag.TYPE_IBAN
    type = registry.iban
