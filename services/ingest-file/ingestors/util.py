import shutil
import pathlib
from banal import decode_path
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


def join_path(*args):
    args = [decode_path(part) for part in args if part is not None]
    return pathlib.Path(*args)


def make_directory(*parts):
    """Create a directory, be quiet if it already exists."""
    file_path = join_path(*parts)
    try:
        file_path.mkdir(parents=True)
    except Exception:
        pass
    return file_path


def remove_directory(file_path):
    """Delete a directory, ignore errors."""
    try:
        shutil.rmtree(file_path, True)
    except Exception:
        pass


def filter_texts(texts):
    """Remove text strings not worth indexing for full-text search."""
    for text in texts:
        if not isinstance(text, str):
            continue
        if not len(text.strip()):
            continue
        try:
            # try to exclude numeric data from
            # spreadsheets
            float(text)
            continue
        except Exception:
            pass
        yield text
