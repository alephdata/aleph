import shutil
import locale
from pathlib import Path
from normality import stringify
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


@contextmanager
def temp_locale(temp):
    try:
        currlocale = locale.getlocale()
    except ValueError:
        currlocale = ('en_US', 'UTF-8')
    locale.setlocale(locale.LC_CTYPE, temp)
    yield
    locale.setlocale(locale.LC_CTYPE, currlocale)
