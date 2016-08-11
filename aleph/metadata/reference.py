from babel import Locale
from pycountry import countries, languages

from aleph.core import get_config

LANGUAGE_NAMES = dict(Locale('en').languages.items())
LANGUAGE_NAMES = {k: v for k, v in LANGUAGE_NAMES.items() if len(k) == 2}


COUNTRY_NAMES = {
    'zz': 'Global',
    'eu': 'European Union',
    'xk': 'Kosovo'
}

for country in countries:
    COUNTRY_NAMES[country.alpha2.lower()] = country.name


def get_languages():
    active = [c.lower().strip() for c in get_config('LANGUAGES')]
    languages = {}
    for code, label in LANGUAGE_NAMES.items():
        if code in active:
            languages[code] = label
    return languages


def get_languages_iso3(codes):
    if codes is None:
        codes = []

    supported = []
    for lang in codes:
        if lang is None or len(lang.strip()) not in [2, 3]:
            continue
        lang = lang.lower().strip()
        if len(lang) == 2:
            try:
                c = languages.get(iso639_1_code=lang)
                lang = c.iso639_3_code
            except KeyError:
                continue
        supported.append(lang)

    # if not len(supported):
    supported.append('eng')
    return '+'.join(sorted(set(supported)))


def is_country_code(code):
    if code is None:
        return False
    return code.lower() in COUNTRY_NAMES.keys()


def is_language_code(code):
    if code is None:
        return False
    return code.lower() in get_languages().keys()
