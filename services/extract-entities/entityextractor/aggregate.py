import logging
from collections import Counter, defaultdict
import phonenumbers
from phonenumbers import geocoder
from normality import normalize
import countrynames
from alephclient.services.entityextract_pb2 import ExtractedEntity

from entityextractor.extract import extract_polyglot, extract_spacy
from entityextractor.patterns import extract_patterns
from entityextractor.normalize import clean_label, label_key
from entityextractor.normalize import select_label
from entityextractor.location import LocationResolver
from entityextractor.util import overlaps, _parse_phonenumber


log = logging.getLogger(__name__)
location_resolver = LocationResolver()


class EntityGroup(object):

    def __init__(self, label, key, category, span):
        self.labels = [label]
        self.categories = [category]
        self.keys = set([key])
        self.spans = set([span])

    def match(self, key, span):
        if key in self.keys:
            return True
        for crit in self.spans:
            if overlaps(span, crit):
                return True
        # TODO: could also do some token-based magic here??
        return False

    def add(self, label, key, category, span):
        self.labels.append(label)
        self.categories.append(category)
        self.keys.add(key)
        self.spans.add(span)

    @property
    def label(self):
        return select_label(self.labels)

    @property
    def category(self):
        return max(set(self.categories), key=self.categories.count)

    @property
    def weight(self):
        return len(self.labels)


class EntityAggregator(object):
    MAX_COUNTRIES = 3

    def __init__(self):
        self.groups = []
        self.record = 0
        self.regex_matches_weights = Counter()
        self.regex_matches_categories = defaultdict(list)

    def extract(self, text, languages):
        self.record += 1
        for language in languages:
            for (l, c, s, e) in extract_polyglot(text, language):
                self.feed(l, c, (self.record, s, e))
            for (l, c, s, e) in extract_spacy(text, language):
                self.feed(l, c, (self.record, s, e))
        for (l, c, s, e) in extract_patterns(text):
            self.regex_matches_weights[l] += 1
            self.regex_matches_categories[l].append(c)

    def feed(self, label, category, span):
        label = clean_label(label, category)
        if label is None:
            return
        key = label_key(label)
        if key is None:
            return
        for group in self.groups:
            if group.match(key, span):
                group.add(label, key, category, span)
                return
        group = EntityGroup(label, key, category, span)
        self.groups.append(group)

    @property
    def _ner_entities(self):
        for group in self.groups:
            # When we have many results, don't return entities which
            # were only found a single time.
            if len(self) > 100 and group.weight == 1:
                continue
            # log.info('%s: %s: %s', group.label, group.category, group.weight)
            yield group.label, group.category, group.weight

    @property
    def _regex_entities(self):
        for match in self.regex_matches_weights:
            category = max(set(self.regex_matches_categories[match]),
                           key=self.regex_matches_categories[match].count)
            weight = self.regex_matches_weights[match]
            yield match, category, weight

    def _get_countries(self, locations, phones):
        countries = Counter()
        for loc, weight in locations.items():
            country = location_resolver.get_country(loc)
            if country:
                countries[country] += weight
        for (phone, weight) in phones:
            country = geocoder.country_name_for_number(phone, 'en')
            country_code = normalize(countrynames.to_code(country))
            countries[country_code] += weight
        for country, weight in countries.most_common(self.MAX_COUNTRIES):
            yield country, ExtractedEntity.COUNTRY, weight

    @property
    def entities(self):
        locations = {}
        phones = []
        for label, category, weight in self._ner_entities:
            if category == ExtractedEntity.LOCATION:
                locations[label] = weight
            yield label, category, weight
        for label, category, weight in self._regex_entities:
            if category == ExtractedEntity.PHONE:
                phone = _parse_phonenumber(label)
                if phone is None:
                    continue
                phones.append((phone, weight))
                label = phonenumbers.format_number(
                    phone, phonenumbers.PhoneNumberFormat.E164
                )
            yield label, category, weight
        for label, category, weight in self._get_countries(locations, phones):
            yield label, category, weight

    def __len__(self):
        return len(self.groups)
