import re
from banal import ensure_list
from followthemoney.types import registry


EMAIL_REGEX = re.compile(r'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}', re.IGNORECASE)  # noqa
PHONE_REGEX = re.compile(r'(\+?[\d\-\(\)\/\s]{5,}\d{2})', re.IGNORECASE)  # noqa
IPV4_REGEX = re.compile(r'(([2][5][0-5]\.)|([2][0-4][0-9]\.)|([0-1]?[0-9]?[0-9]\.)){3}'+'(([2][5][0-5])|([2][0-4][0-9])|([0-1]?[0-9]?[0-9]))')  # noqa
IPV6_REGEX = re.compile(r'(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))')  # noqa
IBAN_REGEX = re.compile(r'\b([a-zA-Z]{2} ?[0-9]{2} ?[a-zA-Z0-9]{4} ?[0-9]{7} ?([a-zA-Z0-9]?){0,16})\b', re.IGNORECASE)  # noqa

REGEX_TYPES = {
    EMAIL_REGEX: registry.email,
    PHONE_REGEX: registry.phone,
    IPV4_REGEX: registry.ip,
    IPV6_REGEX: registry.ip,
    IBAN_REGEX: registry.iban,
}


def extract_patterns(text, countries):
    for pattern, tag_type in REGEX_TYPES.items():
        for match in pattern.finditer(text):
            match_text = match.group(0)
            cleaned_text = tag_type.clean(match_text, countries=countries)
            if cleaned_text is not None:
                yield (tag_type, cleaned_text)
            hints = tag_type.country_hint(cleaned_text)
            for country in ensure_list(hints):
                yield (registry.country, country)
