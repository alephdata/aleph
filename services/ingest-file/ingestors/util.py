import shutil
from normality import stringify
from normality.cleaning import remove_unsafe_chars


def safe_string(data, encoding_default='utf-8', encoding=None):
    """Stringify and round-trip through encoding."""
    data = stringify(data,
                     encoding_default=encoding_default,
                     encoding=encoding)
    data = remove_unsafe_chars(data)
    if data is None:
        return
    data = data.encode(encoding_default, 'replace')
    data = data.decode(encoding_default, 'strict')
    return data


def safe_dict(data):
    """Clean a dictionary to make sure it contains only valid,
    non-null keys and values."""
    if data is None:
        return

    safe = {}
    for key, value in data.items():
        key = safe_string(key)
        value = safe_string(value)
        if key is not None and value is not None:
            safe[key] = value

    if len(safe):
        return safe


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
