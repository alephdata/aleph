import logging
from odf.opendocument import load

from ingestors.support.timestamp import TimestampSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class OpenDocumentSupport(TimestampSupport):
    """Provides helpers for Libre/Open Office tools."""

    def parse_opendocument(self, file_path, entity):
        try:
            doc = load(file_path)
        except Exception:
            raise ProcessingException("Cannot open document.")

        for child in doc.meta.childNodes:
            value = str(child)
            if child.tagName == 'dc:title':
                entity.add('title', value)
            if child.tagName == 'dc:description':
                entity.add('summary', value)
            if child.tagName == 'dc:creator':
                entity.add('author', value)
            if child.tagName == 'dc:date':
                entity.add('date', self.parse_timestamp(value))
            if child.tagName == 'meta:creation-date':
                entity.add('authoredAt', self.parse_timestamp(value))
            if child.tagName == 'meta:generator':
                entity.add('generator', value)

        return doc
