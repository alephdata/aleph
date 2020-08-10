import logging
from lxml import html
from lxml.etree import tostring
from lxml.html.clean import Cleaner
from normality import stringify
from flask_babel import gettext
from werkzeug.urls import url_parse, url_join

log = logging.getLogger(__name__)

CLEANER = Cleaner(
    style=True,
    meta=True,
    links=False,
    remove_tags=["body", "form"],
    kill_tags=[
        "area",
        "audio",
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
        for (el, attr, href, _) in doc.iterlinks():
            href = normalize_href(href, base_url)
            if href is not None:
                el.set(attr, href)
            if el.tag == "a":
                el.set("target", "_blank")
                rel = set(el.get("rel", "").lower().split())
                rel.update(["nofollow", "noreferrer", "external", "noopener"])
                el.set("rel", " ".join(rel))
        return tostring(doc)
    except Exception as exc:
        log.warning("HTML sanitizer failure [%s]: %s", type(exc), exc)
        return gettext("[HTML removed: could not be sanitized]")


def normalize_href(href, base_url):
    # Make links relative to the source_url
    href = stringify(href)
    if href is None:
        return
    if base_url is not None:
        return url_join(base_url, href)
    try:
        parsed = url_parse(href)
        if not parsed.netloc:
            return None
        return href
    except ValueError:
        return None


def html_link(text, link):
    text = text or "[untitled]"
    if link is None:
        return "<span class='reference'>%s</span>" % text
    return "<a class='reference' href='%s'>%s</a>" % (link, text)
