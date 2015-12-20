from hashlib import sha256


def checksum(filename):
    """ Generate a hash for a given file name. """
    hash = sha256()
    with open(filename, 'rb') as fh:
        while True:
            block = fh.read(2 ** 10)
            if not block:
                break
            hash.update(block)
    return hash.hexdigest()
