import pycountry


def get_languages(languages):
    if languages is None or not len(languages):
        languages = ['en']

    supported = []
    for lang in languages:
        if lang is None or len(lang.strip()) not in [2, 3]:
            continue
        lang = lang.lower().strip()
        if len(lang) == 2:
            try:
                c = pycountry.languages.get(iso639_1_code='de')
                lang = c.iso639_3_code
            except KeyError:
                continue
        supported.append(lang)

    supported.append('eng')
    return '+'.join(sorted(set(supported)))
