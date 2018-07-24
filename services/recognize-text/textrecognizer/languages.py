import tesserocr
from languagecodes import list_to_alpha3

# Tesseract language types:
_, LANGUAGES = tesserocr.get_languages()


def get_languages(codes):
    """Turn some ISO2 language codes into ISO3 codes."""
    supported = []
    for code in list_to_alpha3(codes):
        if code in LANGUAGES:
            supported.append(code)
    return '+'.join(sorted(supported))
