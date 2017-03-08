import fingerprints
from normality import stringify


def make_fingerprint(text):
    """Generate a normalised entity name, used for the graph."""
    text = stringify(text)
    if text is None:
        return
    return fingerprints.generate(text)
