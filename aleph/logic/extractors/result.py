import io
import csv
import logging
from banal import ensure_list
from ahocorasick import Automaton
from collections import defaultdict
from normality import normalize, collapse_spaces
from fingerprints import clean_entity_name
from followthemoney.types import registry

from aleph import settings
from aleph.model import DocumentTag

log = logging.getLogger(__name__)


class Result(object):
    strict = True

    def __init__(self, ctx, label, start, end):
        self.ctx = ctx
        self.label = label
        self.key = self.normalize(label)
        self.start = start
        self.end = end
        self.span = (ctx.record, start, end)
        self.countries = []

    def normalize(self, location):
        return normalize(location, lowercase=True, ascii=True)

    def __str__(self):
        return self.label


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
        if not len(text) or len(text) < self.MIN_LENGTH:
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
                self.countries = self.automaton.get(self.key)
            except KeyError:
                pass

    def load_places(self):
        places = defaultdict(set)
        with io.open(settings.GEONAMES_DATA, 'r', encoding='utf-8') as fh:
            for row in csv.reader(fh, delimiter='\t'):
                country = normalize(row[8])
                if country is None:
                    continue
                names = set(row[3].split(','))
                names.add(row[1])
                names.add(row[2])
                for name in names:
                    name = self.normalize(name)
                    if name is not None:
                        places[name].add(country)
        return places

    @property
    def automaton(self):
        if not hasattr(settings, '_geonames'):
            log.debug("Loading geonames data...")
            geonames = Automaton()
            places = self.load_places()
            for (name, countries) in places.items():
                geonames.add_word(name, countries)
            geonames.make_automaton()
            settings._geonames = geonames
            log.debug("Loaded %s geonames.", len(places))
        return settings._geonames


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
