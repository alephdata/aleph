import re
import logging

from aleph import settings
from aleph.analyze.analyzer import EntityAnalyzer
from aleph.model import DocumentTag

log = logging.getLogger(__name__)

# URLs:
# https://gist.github.com/uogbuji/705383
# REGEX = ur'(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:\'".,<>?\xab\xbb\u201c\u201d\u2018\u2019]))'  # noqa


class RegexAnalyzer(EntityAnalyzer):

    def extract_match(self, document, match):
        return match.group(0)

    def extract(self, collector, document):
        for text in document.texts:

            if hasattr(self, 'RE_list'):
                for list_RE in self.RE_list:
                    for match in list_RE.finditer(text):
                        match_text = self.extract_match(document, match)

                        if match_text is not None:
                            collector.emit(match_text, self.TYPE)

            else:
                for match in self.RE.finditer(text):
                    match_text = self.extract_match(document, match)

                    if match_text is not None:
                        collector.emit(match_text, self.TYPE)


class EMailAnalyzer(RegexAnalyzer):
    REGEX = '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
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
    REGEX=['(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))','(([2][5][0-5]\.)|([2][0-4][0-9]\.)|([0-1]?[0-9]?[0-9]\.)){3}'+'(([2][5][0-5])|([2][0-4][0-9])|([0-1]?[0-9]?[0-9]))']

    RE_list = list(map(re.compile, REGEX))
    ORIGIN = 'regex:ip'
    TYPE = DocumentTag.TYPE_IP

    def __init__(self):
        self.active = settings.ANALYZE_IP


class IBANAnalyzer(RegexAnalyzer):
    REGEX = '([a-zA-Z]{2} ?[0-9]{2} ?[a-zA-Z0-9]{4} ?[0-9]{7} ?([a-zA-Z0-9]?){0,16})'

    RE = re.compile(REGEX, re.IGNORECASE)
    ORIGIN = 'regex:iban'
    TYPE = DocumentTag.TYPE_IBAN

    def __init__(self):
        self.active = settings.ANALYZE_IBAN
