import re
import logging
from dalet import parse_phone

from aleph.analyze.analyzer import Analyzer
from aleph.model import DocumentTag, DocumentTagCollector

log = logging.getLogger(__name__)

# URLs:
# https://gist.github.com/uogbuji/705383
# REGEX = ur'(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:\'".,<>?\xab\xbb\u201c\u201d\u2018\u2019]))'  # noqa


class RegexAnalyzer(Analyzer):
    REGEX = None
    FLAG = None

    def prepare(self):
        # TODO: re-think this.
        self.disabled = self.document.type == self.document.TYPE_TABULAR
        self.collector = DocumentTagCollector(self.document, self.ORIGIN)
        self.regex = re.compile(self.REGEX, self.FLAG)

    def on_text(self, text):
        if not self.disabled:
            for mobj in self.regex.finditer(text):
                self.on_match(mobj)

    def finalize(self):
        self.collector.save()


class EMailAnalyzer(RegexAnalyzer):
    REGEX = '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
    FLAG = re.IGNORECASE
    ORIGIN = 'regex:email'

    def on_match(self, match):
        text = match.group(0)
        self.collector.emit(text, DocumentTag.TYPE_EMAIL)


class PhoneNumberAnalyzer(RegexAnalyzer):
    REGEX = r'(\+?[\d\-\(\)\/\s]{5,})'
    CHARS = '+0123456789'
    FLAG = re.IGNORECASE
    ORIGIN = 'regex:phones'

    def on_match(self, match):
        match = match.group(0)
        match = ''.join([m for m in match if m in self.CHARS])
        if len(match) < 5:
            return
        for country in [None] + self.document.countries:
            num = parse_phone(match, country=country)
            if num is None:
                continue
            self.collector.emit(num, DocumentTag.TYPE_PHONE)
