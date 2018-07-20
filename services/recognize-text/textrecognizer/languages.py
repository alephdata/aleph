import tesserocr
from banal import ensure_list
from languagecodes import iso_639_alpha3

# Tesseract language types:
_, LANGUAGES = tesserocr.get_languages()
LANG_SYNONYMS = [
    ('srp', 'hbs', 'hrv'),
    ('sli', 'alb'),
    ('slk', 'slo'),
    ('ron', 'rum'),
    ('nor', 'non'),
    ('nld', 'dut'),
    ('mya', 'bur'),
    ('msa', 'may'),
    ('mkd', 'mac'),
    ('kat', 'geo'),
    ('isl', 'ice'),
    ('isl', 'ice'),
    ('fre', 'fra', 'frm'),
    ('fas', 'per'),
    ('eus', 'baq'),
    ('ell', 'gre'),
    ('ger', 'deu'),
    ('wel', 'cym'),
    ('chi_sim', 'chi_tra', 'chi', 'zho'),
    ('ces', 'cze'),
    ('bod', 'tib'),
    ('aze_cyrl', 'aze'),
]


def get_languages(codes):
    """Turn some ISO2 language codes into ISO3 codes."""
    languages = set(['eng'])
    for code in ensure_list(codes):
        code = iso_639_alpha3(code)
        if code is None:
            continue
        languages.add(code)
        for synonyms in LANG_SYNONYMS:
            if code in synonyms:
                languages.update(synonyms)

    supported = []
    for code in languages:
        if code in LANGUAGES:
            supported.append(code)
    return '+'.join(sorted(supported))
