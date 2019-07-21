import codecs
import logging
import chardet
from normality import stringify, guess_encoding
from normality.encoding import guess_file_encoding, normalize_result

from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class EncodingSupport(object):
    """Decode the contents of the given file as plain text by guessing its
    encoding."""
    DEFAULT_ENCODING = 'utf-8'

    def _is_encoding_codec(self, encoding):
        """Check if a given string is a valid encoding name."""
        try:
            codecs.lookup(encoding)
            return True
        except LookupError:
            return False

    def normalize_encoding(self, encoding):
        """Make sure that the given string is a valid encoding name."""
        encoding = stringify(encoding)
        if encoding is None:
            return self.DEFAULT_ENCODING
        if self._is_encoding_codec(encoding):
            return encoding
        encoding = encoding.replace('-', '')
        if self._is_encoding_codec(encoding):
            return encoding
        return self.DEFAULT_ENCODING

    def decode_string(self, text, encoding=DEFAULT_ENCODING):
        if not isinstance(text, bytes):
            return stringify(text)
        encoding = self.normalize_encoding(encoding)
        try:
            return text.decode(encoding, 'strict')
        except Exception:
            try:
                detected = guess_encoding(text)
                return text.decode(detected, 'strict')
            except Exception:
                return text.decode(encoding, 'replace')

    def detect_stream_encoding(self, fh, default=DEFAULT_ENCODING):
        return guess_file_encoding(fh, default=default)

    def detect_list_encoding(self, items, default=DEFAULT_ENCODING):
        detector = chardet.UniversalDetector()
        for text in items:
            if not isinstance(text, bytes):
                continue
            detector.feed(text)
            if detector.done:
                break

        detector.close()
        return normalize_result(detector.result, default)

    def read_file_decoded(self, entity, file_path):
        with open(file_path, 'rb') as fh:
            body = fh.read()
            if not entity.has('encoding'):
                result = chardet.detect(body)
                encoding = normalize_result(result, self.DEFAULT_ENCODING)
                entity.set('encoding', encoding)

        for encoding in entity.get('encoding'):
            try:
                body = body.decode(encoding)
                if encoding != self.DEFAULT_ENCODING:
                    log.info("Decoding [%r] as: %s", entity, encoding)
                return body
            except UnicodeDecodeError as ude:
                raise ProcessingException('Error decoding file as %s: %s' %
                                          (encoding, ude)) from ude
