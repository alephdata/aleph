
# Tesseract 3.05 language types:
LANGUAGES = {
    'afr': ['af'],
    'amh': ['am'],
    'ara': ['ar'],  # arabic
    'asm': ['as'],
    'aze': ['az'],
    'aze_cyrl': ['az', 'aze'],
    'bel': ['be'],
    'ben': ['bn'],
    'bod': ['tib', 'bo'],
    'bos': ['bs', 'hbs'],
    'bul': ['bg'],
    'cat': ['ca'],
    'ceb': [],
    'ces': ['cze', 's'],
    'chi_sim': ['chi', 'zho', 'zh'],
    'chi_tra': ['chi', 'zho', 'zh'],
    'chr': [],
    'cym': ['wel', 'cy'],
    'deu': ['ger', 'de'],
    'dzo': ['dz'],
    'ell': ['gre', 'el'],
    'eng': ['en', 'enm'],
    'enm': [],  # middle en
    'epo': ['eo'],
    'equ': [''],
    'est': ['et'],
    'eus': ['baq', 'eu'],
    'fas': ['per', 'fa'],
    'fin': ['fi'],
    'fra': ['fre', 'fr', 'frm'],
    'frk': [],  # fraktur
    'frm': [],  # middle french
    'gle': ['ga'],
    'glg': ['gl'],
    'grc': [],  # classic el
    'guj': ['gu'],
    'hat': ['ht'],
    'heb': ['he'],
    'hin': ['hi'],
    'hrv': ['hr', 'hbs'],
    'hun': ['hu'],
    'iku': ['iu'],  # inuktitut
    'isl': ['ice', 'is'],
    'ita': ['it'],
    'jav': ['jv'],
    'jpn': ['ja'],
    'kan': ['kn'],  # kannada
    'kat': ['geo', 'ka'],
    'kaz': ['kk'],
    'khm': ['km'],
    'kir': ['ky'],
    'kor': ['ko'],
    'kur': ['ku'],
    'lao': ['lo'],
    'lat': ['la'],
    'lav': ['lv'],
    'lit': ['lt'],
    'mal': ['ml'],
    'mar': ['mr'],
    'mkd': ['mk', 'mac'],
    'mlt': ['mt'],
    'msa': ['may', 'ms'],
    'mya': ['bur', 'my'],
    'nep': ['ne'],
    'nld': ['dut', 'nl'],
    'nor': ['no', 'non'],
    'ori': ['or'],
    'pan': ['pa'],
    'pol': ['pl'],
    'por': ['pt'],
    'pus': ['ps'],
    'ron': ['rum', 'ro'],
    'rus': ['ru'],
    'san': ['sa'],
    'sin': ['si'],
    'slk': ['slo', 'sk'],
    'slv': ['sl'],
    'spa': ['es'],
    'sqi': ['alb', 'sq'],
    'srp': ['sr', 'hbs'],
    'swa': ['sw'],
    'swe': ['sv'],
    'syr': [],
    'tam': ['ta'],
    'tel': ['te'],
    'tgk': ['tg'],
    'tgl': ['tl'],
    'tha': ['th'],
    'tir': ['ti'],
    'tur': ['tr'],
    'uig': ['ug'],
    'ukr': ['uk'],
    'urd': ['ur'],
    'uzb': ['uz'],
    'vie': ['vi'],
    'yid': ['yi']
}


def normalize_language(language):
    """Turn some ISO2 language codes into ISO3 codes."""
    # tesserocr.get_languages()
    if language is None:
        return set()
    lang = language.lower().strip()
    matches = set()
    for (code, aliases) in LANGUAGES.items():
        if lang == code or lang in aliases:
            matches.add(code)
    return matches
