import fingerprints

from aleph.text import string_value


def make_fingerprint(text):
    """Generate a normalised entity name, used for the graph."""
    text = string_value(text)
    if text is None:
        return
    return fingerprints.generate(text)
