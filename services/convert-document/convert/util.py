from celestial import normalize_extension


class ConversionFailure(Exception):
    pass


def handle_timeout(signum, frame):
    raise ConversionFailure('Conversion timed out.')


def parse_extensions(extensions):
    if extensions is not None:
        for ext in extensions.split(' '):
            if ext == '*':
                continue
            ext = normalize_extension(ext)
            if ext is not None:
                yield ext
