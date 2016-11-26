import fingerprints

from aleph.text import string_value


def make_fingerprint(text):
    """Generate a normalised entity name, used for the graph."""
    return fingerprints.generate(string_value(text))