import urlnorm
from urlparse import urldefrag


def normalize_url(url):
    # TODO: learn from https://github.com/hypothesis/h/blob/master/h/api/uri.py
    try:
        norm = urlnorm.norm(url)
        norm, _ = urldefrag(norm)
        return norm.rstrip('/')
    except:
        return None


def normalize_email(email):
    if '@' not in email:
        return None
    mailbox, domain = email.rsplit('@', 1)
    domain = domain.strip().lower()
    if not len(domain):
        return None
    return '%s@%s' % (mailbox, domain)
