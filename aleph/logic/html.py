# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

import logging
from lxml import html
from lxml.etree import tostring
from lxml.html.clean import Cleaner
from flask_babel import gettext

log = logging.getLogger(__name__)

CLEANER = Cleaner(
    style=True,
    meta=True,
    links=False,
    scripts=True,
    javascript=True,
    remove_tags=["body", "form"],
    kill_tags=[
        "area",
        "audio",
        "svg",
        "base",
        "bgsound",
        "embed",
        "frame",
        "frameset",
        "head",
        "img",
        "iframe",
        "input",
        "link",
        "map",
        "meta",
        "nav",
        "object",
        "plaintext",
        "track",
        "video",
    ],
)


def sanitize_html(html_text, base_url, encoding=None):
    """Remove anything from the given HTML that must not show up in the UI."""
    if html_text is None or not len(html_text.strip()):
        return
    try:
        cleaned = CLEANER.clean_html(html_text)
        encoding = encoding or "utf-8"
        parser = html.HTMLParser(encoding=encoding)
        data = cleaned.encode(encoding, "replace")
        doc = html.document_fromstring(data, parser=parser)
        if base_url is not None and len(base_url.strip()):
            try:
                doc.make_links_absolute(base_url)
            except TypeError:
                pass
        for (el, attr, href, _) in doc.iterlinks():
            if el.tag == "a":
                el.set("target", "_blank")
                el.set("rel", "nofollow noreferrer external noopener")
        return tostring(doc)
    except Exception as exc:
        log.warning("HTML sanitizer failure [%s]: %s", type(exc), exc)
        return gettext("[HTML removed: could not be sanitized]")


def html_link(text, link):
    text = text or "[untitled]"
    if link is None:
        return "<span class='reference'>%s</span>" % text
    return "<a class='reference' href='%s'>%s</a>" % (link, text)
