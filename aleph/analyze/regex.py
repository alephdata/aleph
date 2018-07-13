import re
import logging

from aleph import settings
from aleph.analyze.analyzer import EntityAnalyzer
from aleph.model import DocumentTag

log = logging.getLogger(__name__)


class RegexAnalyzer(EntityAnalyzer):

    def extract_match(self, document, match):
        return match.group(0)

    def extract(self, collector, document):
        for text in document.texts:
            for match in self.RE.finditer(text):
                match_text = self.extract_match(document, match)

                if match_text is not None:
                    collector.emit(match_text, self.TYPE)


class EMailAnalyzer(RegexAnalyzer):
    REGEX = r'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
    RE = re.compile(REGEX, re.IGNORECASE)
    ORIGIN = 'regex:email'
    TYPE = DocumentTag.TYPE_EMAIL

    def __init__(self):
        self.active = settings.ANALYZE_EMAILS


class PhoneNumberAnalyzer(RegexAnalyzer):
    REGEX = r'(\+?[\d\-\(\)\/\s]{5,})'
    RE = re.compile(REGEX, re.IGNORECASE)
    ORIGIN = 'regex:phones'
    TYPE = DocumentTag.TYPE_PHONE

    def __init__(self):
        self.active = settings.ANALYZE_PHONES


class IPAnalyzer(RegexAnalyzer):
    REGEX = r'\b(0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5]))\b'  # noqa
    RE = re.compile(REGEX, re.IGNORECASE)
    ORIGIN = 'regex:ip'
    TYPE = DocumentTag.TYPE_IP

    def __init__(self):
        self.active = settings.ANALYZE_IP


class IBANAnalyzer(RegexAnalyzer):
    REGEX = r'\b([a-zA-Z]{2} ?[0-9]{2} ?[a-zA-Z0-9]{4} ?[0-9]{7} ?([a-zA-Z0-9]?){0,16})\b'  # noqa
    RE = re.compile(REGEX, re.IGNORECASE)
    ORIGIN = 'regex:iban'
    TYPE = DocumentTag.TYPE_IBAN

    def __init__(self):
        self.active = settings.ANALYZE_IBAN
