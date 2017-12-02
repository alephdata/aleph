# coding: utf-8
from normality import normalize
from lxml.html.clean import Cleaner

CLEANER = Cleaner(
    style=True,
    links=False,
    add_nofollow=True,
    kill_tags=['head']
)


def match_form(text):
    """Turn a string into a form appropriate for name matching."""
    # The goal of this function is not to retain a readable version of the
    # string, but rather to yield a normalised version suitable for
    # comparisons and machine analysis.
    return normalize(text, lowercase=True, ascii=True)


def sanitize_html(html_text):
    """Remove anything from the given HTML that must not show up in the UI."""
    # TODO: circumvent encoding declarations? 
    # TODO: make links relative the source_url?
    if html_text is None:
        return
    return CLEANER.clean_html(html_text)
