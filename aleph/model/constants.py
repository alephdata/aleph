from babel import Locale
from pycountry import countries

COLLECTION_CATEGORIES = {
    'news': 'News reports',
    'leak': 'Leaks',
    'gazette': 'Gazette notices',
    'court': 'Court cases',
    'company': 'Company records',
    'watchlist': 'Watchlist',
    'scrape': 'Scrapes',
    'procurement': 'Procurement',
    'grey': 'Grey Literature'
}

COUNTRY_NAMES = {
    'zz': 'Global',
    'xk': 'Kosovo'
}

for country in countries:
    COUNTRY_NAMES[country.alpha2.lower()] = country.name


LANGUAGE_NAMES = dict(Locale('en').languages.items())
LANGUAGE_NAMES = {k: v for k, v in LANGUAGE_NAMES.items() if len(k) == 2}
