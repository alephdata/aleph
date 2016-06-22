import re
import six
import urlnorm
from urlparse import urlparse
from datetime import date, datetime
from urlparse import urldefrag

DATE_RE = re.compile(r'^[12]\d{3}-[012]?\d-[0123]?\d$')
VALID_DOMAIN = re.compile(r'^([0-9a-z][-\w]*[0-9a-z]\.)+[a-z0-9\-]{2,15}$')


def chomp(text, lower=False):
    if text is not None:
        if not isinstance(text, six.text_type):
            text = six.text_type(text)
        text = text.strip()
        if len(text):
            return text.lower() if lower else text


def is_valid_date(text):
    return DATE_RE.match(text) is not None


def parse_date(text):
    if isinstance(text, datetime):
        text = text.date()
    if isinstance(text, date):
        return text.isoformat()
    text = chomp(text)[:10]
    if is_valid_date(text):
        return text


def normalize_url(url):
    """Normalize a URL."""
    # TODO: learn from https://github.com/hypothesis/h/blob/master/h/api/uri.py
    try:
        norm = urlnorm.norm(url)
        norm, _ = urldefrag(norm)
        return norm
    except:
        return None


def parse_url(text):
    url = chomp(text)
    if url is not None:
        if url.startswith('//'):
            url = 'http:%s' % url
        elif '://' not in url:
            url = 'http://%s' % url
        return normalize_url(url)
    return None, None


def is_valid_domain(domain):
    """Validate an IDN compatible domain."""
    domain = domain.encode('idna').lower()
    return bool(VALID_DOMAIN.match(domain))


def parse_domain(text):
    domain = chomp(text)
    if domain is not None:
        if '://' in domain:
            try:
                domain = urlparse(domain).hostname
            except ValueError:
                return
        if domain.startswith('www.'):
            domain = domain[len('www.'):]
        domain = domain.strip('.')
        if is_valid_domain(domain):
            return domain
