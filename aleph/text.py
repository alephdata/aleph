# coding: utf-8
from normality import normalize


def match_form(text):
    """Turn a string into a form appropriate for name matching."""
    # The goal of this function is not to retain a readable version of the
    # string, but rather to yield a normalised version suitable for
    # comparisons and machine analysis.
    return normalize(text, lowercase=True, ascii=True)
