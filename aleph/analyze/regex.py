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

class ipV4_Analyzer(RegexAnalyzer):
    REGEX = '(([2][5][0-5]\.)|([2][0-4][0-9]\.)|([0-1]?[0-9]?[0-9]\.)){3}'+'(([2][5][0-5])|([2][0-4][0-9])|([0-1]?[0-9]?[0-9]))'

    RE = re.compile(REGEX, re.IGNORECASE)
    ORIGIN = 'regex:ipv4'
    TYPE = DocumentTag.TYPE_IPV4

    def __init__(self):
        self.active = settings.ANALYZE_IPV4


# class ipV6_Analyzer(RegexAnalyzer):
#     REGEX='(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))'
#
#     RE = re.compile(REGEX, re.IGNORECASE)
#     ORIGIN = 'regex:ipv6'
#     TYPE = DocumentTag.TYPE_IPV6
#
#     def __init__(self):
#         self.active = settings.ANALYZE_IPV6




# match = ipv4.search("Your ip address is 192.168.0.1, have fun!")
# if match:
#     print('IPv4 address found:')
#     print(match.group()) # matching substring
#     print('at position',match.span()) # indexes of the substring found
# else:
#     print('IPv4 address not found')


#
# ipv6 =
# match = ipv6.search("Your ip address is 2001:0db8:85a3:0000:0000:8a2e:0370:7334, have fun!")
# if match:
#     print('IPv6 address found:')
#     print(match.group()) # matching substring
#     print('at position',match.span()) # indexes of the substring found
# else:
#     print('IPv6 address not found')
