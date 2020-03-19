import re
from banal import ensure_list
from followthemoney.types import registry

from ingestors.analysis.util import TAG_EMAIL, TAG_PHONE
from ingestors.analysis.util import TAG_IBAN, TAG_COUNTRY


EMAIL_REGEX = re.compile(r'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}', re.IGNORECASE)  # noqa
PHONE_REGEX = re.compile(r'(\+?[\d\-\(\)\/\s]{5,}\d{2})', re.IGNORECASE)  # noqa
IBAN_REGEX = re.compile(r'\b([a-zA-Z]{2} ?[0-9]{2} ?[a-zA-Z0-9]{4} ?[0-9]{7} ?([a-zA-Z0-9]?){0,16})\b', re.IGNORECASE)  # noqa

REGEX_TYPES = {
    EMAIL_REGEX: TAG_EMAIL,
    PHONE_REGEX: TAG_PHONE,
    IBAN_REGEX: TAG_IBAN,
}


def extract_patterns(entity, text):
    countries = entity.get_type_values(registry.country)
    for pattern, prop_name in REGEX_TYPES.items():
        prop = entity.schema.get(prop_name)
        for match in pattern.finditer(text):
            match_text = match.group(0)
            value = prop.type.clean(match_text, countries=countries)
            if not prop.type.validate(value, countries=countries):
                continue
            yield (prop_name, value)
            for country in ensure_list(prop.type.country_hint(value)):
                yield (TAG_COUNTRY, country)
