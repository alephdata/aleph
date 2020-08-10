import shutil
import locale
import socket
import random
from pathlib import Path
from normality import stringify
from urllib.parse import urlparse
from contextlib import contextmanager


def remove_directory(file_path):
    """Delete a directory, ignore errors."""
    try:
        shutil.rmtree(file_path, True)
    except Exception:
        pass


def filter_text(text):
    """Remove text strings not worth indexing for full-text search."""
    text = stringify(text)
    if text is None:
        return False
    if not len(text.strip()):
        return False
    try:
        # try to exclude numeric data from spreadsheets
        float(text)
        return False
    except Exception:
        pass
    # TODO: should we check there's any alphabetic characters in the
    # text to avoid snippets entirely comprised of non-text chars?
    return True


def path_string(path):
    """Convert possible path objects to strings."""
    if isinstance(path, Path):
        return path.as_posix()
    return path


def explicit_resolve(url):
    """Explicitly resolve round-robin DNS names into a random IP address.

    This is a weird mitigation for the fact that docker-compose and Python
    requests don't seem to do DNS round robin correctly between them. It
    seems nicer than messing with the urllib3 connection pool, but it would
    break if a deployment used a proxy with host-based resolution between
    the ingestors and the convert-doc service. So... don't do that.
    """
    parsed = urlparse(url)
    _, _, ips = socket.gethostbyname_ex(parsed.hostname)
    netloc = "{}:{}".format(random.choice(ips), parsed.port)
    return parsed._replace(netloc=netloc).geturl()


@contextmanager
def temp_locale(temp):
    try:
        currlocale = locale.getlocale()
    except ValueError:
        currlocale = ("en_US", "UTF-8")
    locale.setlocale(locale.LC_CTYPE, temp)
    yield
    locale.setlocale(locale.LC_CTYPE, currlocale)
