import re
import logging

from aleph.analyze.analyzer import Analyzer
from aleph.data.parse import parse_phone

log = logging.getLogger(__name__)


class RegexAnalyzer(Analyzer):
    REGEX = None
    FLAG = None

    def prepare(self):
        # TODO: re-think this.
        self.disabled = self.document is not None and \
            self.document.type == self.document.TYPE_TABULAR
        self.matches = []
        self.regex = re.compile(self.REGEX, self.FLAG)

    def on_text(self, text):
        if not self.disabled:
            for mobj in self.regex.finditer(text):
                self.matches.append(mobj)


class EMailAnalyzer(RegexAnalyzer):
    REGEX = '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
    FLAG = re.IGNORECASE

    def finalize(self):
        matches = set([m.group(0) for m in self.matches])
        if len(matches):
            log.info("Found emails: %r", matches)

        for email in matches:
            self.meta.add_email(email)


class URLAnalyzer(RegexAnalyzer):
    # https://gist.github.com/uogbuji/705383
    REGEX = ur'(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:\'".,<>?\xab\xbb\u201c\u201d\u2018\u2019]))'  # noqa
    FLAG = re.IGNORECASE

    def finalize(self):
        matches = set([m.group(0) for m in self.matches])
        if len(matches):
            log.info("Found URLs: %r", matches)

        for url in matches:
            self.meta.add_url(url)


class PhoneNumberAnalyzer(RegexAnalyzer):
    REGEX = r'(\+?[\d\-\(\)\/\s]{5,})'
    CHARS = '+0123456789'
    FLAG = re.IGNORECASE

    def finalize(self):
        for match in self.matches:
            match = match.group(0)
            match = ''.join([m for m in match if m in self.CHARS])
            if len(match) < 5:
                continue
            for country in [None] + self.meta.countries:
                num = parse_phone(match, country=country)
                if num is not None:
                    log.info("Extraced phone: %s", num)
                    self.meta.add_phone_number(num)
