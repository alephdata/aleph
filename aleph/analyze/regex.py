import re
import logging

from aleph.analyze.analyzer import Analyzer
# https://github.com/daviddrysdale/python-phonenumbers
# https://gist.github.com/dideler/5219706

log = logging.getLogger(__name__)


class RegexAnalyzer(Analyzer):
    REGEX = None
    FLAG = None

    def prepare(self):
        self.matches = []
        self.regex = re.compile(self.REGEX, self.FLAG)

    def on_text(self, text):
        for mobj in self.regex.finditer(text):
            self.matches.append(mobj)


class EMailAnalyzer(RegexAnalyzer):
    REGEX = '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
    FLAG = re.IGNORECASE

    def finalize(self):
        matches = set([m.group(0) for m in self.matches])
        if len(matches):
            log.info("Found emails: %r", matches)

        emails = self.meta.get('emails') or []
        emails.extend(matches)
        self.meta['emails'] = emails


class URLAnalyzer(RegexAnalyzer):
    # https://gist.github.com/uogbuji/705383
    REGEX = ur'(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:\'".,<>?\xab\xbb\u201c\u201d\u2018\u2019]))'  # noqa
    FLAG = re.IGNORECASE

    def finalize(self):
        matches = set([m.group(0) for m in self.matches])
        if len(matches):
            log.info("Found URLs: %r", matches)

        urls = self.meta.get('urls') or []
        urls.extend(matches)
        self.meta['urls'] = urls
