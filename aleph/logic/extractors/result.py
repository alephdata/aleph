import logging
from banal import ensure_list
from normality import collapse_spaces
from fingerprints import clean_entity_name
from followthemoney import model

from aleph.core import kv
from aleph.logic.extractors.util import normalize_label, place_key

log = logging.getLogger(__name__)


class Result(object):
    __slots__ = ['label', 'key', 'span', 'countries']
    strict = True
    prop = None

    def __init__(self, label, span, countries):
        args = dict(countries=countries)
        self.label = self.prop.type.clean(label, **args)
        self.key = normalize_label(self.label)
        self.span = span
        countries = self.prop.type.country_hint(self.label)
        self.countries = ensure_list(countries)

    def __str__(self):
        return self.label

    def __repr__(self):
        return '<Result(%s,%s)>' % (self.label, self.category)

    @classmethod
    def create(cls, aggregator, label, start, end):
        span = (aggregator.record, start, end)
        return cls(label, span, aggregator.countries)


class NameResult(Result):
    """Any entity extracted that has a human-style name."""
    strict = False
    prop = model.get_qname('Document:namesMentioned')
    MAX_LENGTH = 100
    MIN_LENGTH = 4

    def __init__(self, label, span, countries):
        label = self.clean_name(label)
        super(NameResult, self).__init__(label, span, countries)
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


class LocationResult(Result):
    """Locations are being mapped to countries."""
    prop = model.get_qname('Document:locationMentioned')

    def __init__(self, label, span, countries):
        super(LocationResult, self).__init__(label, span, countries)
        if self.key is not None:
            try:
                value = kv.lrange(place_key(self.key), 0, -1)
                self.countries = ensure_list(value)
            except KeyError:
                pass


class LanguageResult(Result):
    prop = model.get_qname('Document:language')


class CountryResult(Result):
    prop = model.get_qname('Thing:country')


class IPAddressResult(Result):
    prop = model.get_qname('Document:ipMentioned')


class EmailResult(Result):
    prop = model.get_qname('Document:emailMentioned')


class PhoneResult(Result):
    prop = model.get_qname('Document:phoneMentioned')


class IBANResult(Result):
    prop = model.get_qname('Document:ibanMentioned')
