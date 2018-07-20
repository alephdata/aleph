import re
from Levenshtein import setmedian
from normality import normalize, collapse_spaces

MAX_LENGTH = 100
MIN_LENGTH = 4

CLEANUP = r'^\W*((mr|ms|miss|the|of|de)\.?\s+)*(?P<term>.*?)([\'’]s)?\W*$'
CLEANUP = re.compile(CLEANUP, re.I | re.U)


def clean_label(text):
    if text is None or len(text) > MAX_LENGTH:
        return
    match = CLEANUP.match(text)
    if match is not None:
        text = match.group('term')
    text = collapse_spaces(text)
    if not len(text) or len(text) < MIN_LENGTH:
        return
    if ' ' not in text:
        return
    return text


def label_key(label):
    return normalize(label, ascii=True)


def select_label(labels):
    return setmedian(labels)
