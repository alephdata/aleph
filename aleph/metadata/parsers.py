import re
import urlnorm
from urlparse import urlparse
from datetime import date, datetime
from urlparse import urldefrag

from aleph.text import string_value
from aleph.data.validate import is_partial_date

VALID_DOMAIN = re.compile(r'^([0-9a-z][-\w]*[0-9a-z]\.)+[a-z0-9\-]{2,15}$')


def parse_date(text):
    if isinstance(text, datetime):
        text = text.date()
    if isinstance(text, date):
        return text.isoformat()
    text = string_value(text)[:10]
    if text is not None and is_partial_date(text):
        return text


def is_valid_domain(domain):
    """Validate an IDN compatible domain."""
    try:
        domain = domain.encode('idna').lower()
        return bool(VALID_DOMAIN.match(domain))
    except:
        return False


def parse_domain(text):
    """Extract a domain name from a piece of text."""
    domain = string_value(text)
    if domain is not None:
        if '://' in domain:
            try:
                domain = urlparse(domain).hostname
            except ValueError:
                return
        domain = domain.lower()
        if domain.startswith('www.'):
            domain = domain[len('www.'):]
        domain = domain.strip('.')
        if is_valid_domain(domain):
            return domain
