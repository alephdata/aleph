import re
import logging
from lxml import html
from lxml.etree import ParseError, ParserError
from normality import collapse_spaces

from ingestors.support.timestamp import TimestampSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class HTMLSupport(TimestampSupport):
    """Provides helpers for HTML file context extraction."""
    # this is from lxml/apihelpers.pxi
    RE_XML_ENCODING = re.compile(r'^(<\?xml[^>]+)\s+encoding\s*=\s*["\'][^"\']*["\'](\s*\?>|)', re.U)  # noqa

    def get_meta(self, doc, field):
        for field_attr in ('property', 'name'):
            for el in doc.findall('.//meta[@%s="%s"]' % (field_attr, field)):
                content = collapse_spaces(el.get('content'))
                if content is not None and len(content):
                    return content

    def extract_html_header(self, entity, doc):
        """Get metadata from the HTML head element."""
        entity.add('title', self.get_meta(doc, 'og:title'))
        entity.add('title', doc.findtext('.//title'))
        entity.add('summary', self.get_meta(doc, 'og:description'))
        entity.add('summary', self.get_meta(doc, 'description'))
        entity.add('author', self.get_meta(doc, 'author'))
        entity.add('author', self.get_meta(doc, 'og:site_name'))
        published_at = self.get_meta(doc, 'artcile:published_time')
        entity.add('publishedAt', self.parse_timestamp(published_at))
        modified_at = self.get_meta(doc, 'artcile:modified_time')
        entity.add('modifiedAt', self.parse_timestamp(modified_at))

        for field in ['keywords', 'news_keywords']:
            content = self.get_meta(doc, field)
            if content is not None:
                for keyword in content.split(','):
                    entity.add('keywords', collapse_spaces(keyword))

    def extract_html_text(self, doc):
        """Get all text from a DOM, also used by the XML parser."""
        text = ' '.join(self.extract_html_elements(doc))
        text = collapse_spaces(text)
        if len(text):
            return text

    def extract_html_elements(self, el):
        try:
            if el.tag in ['script', 'style', 'head']:
                return
            yield el.text or ' '
            for child in el:
                yield from self.extract_html_elements(child)
            yield el.tail or ' '
        except Exception as exc:
            log.warning("HTML node error: %r", exc)

    def extract_html_content(self, entity, html_body, extract_metadata=True):
        """Ingestor implementation."""
        if html_body is None or not len(html_body.strip()):
            return
        entity.add('bodyHtml', html_body)
        try:
            try:
                doc = html.fromstring(html_body)
            except ValueError:
                # Ship around encoding declarations.
                # https://stackoverflow.com/questions/3402520
                html_body = self.RE_XML_ENCODING.sub('', html_body, count=1)
                doc = html.fromstring(html_body)
        except (ParserError, ParseError, ValueError) as exc:
            raise ProcessingException("Couldn't parse HTML: %s" % exc) from exc

        if extract_metadata:
            self.extract_html_header(entity, doc)
        try:
            text = self.extract_html_text(doc)
            entity.add('indexText', text)
            return text
        except Exception:
            log.exception("Error extracting text from HTML")
