import logging
import zipfile
from zipfile import ZipFile, BadZipfile

from ingestors.support.xml import XMLSupport
from ingestors.support.timestamp import TimestampSupport
# from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class OOXMLSupport(TimestampSupport, XMLSupport):
    """Provides helpers for Office Open XML format metadata."""
    PROP_FILE = 'docProps/core.xml'
    CP_NS = '{http://schemas.openxmlformats.org/package/2006/metadata/core-properties}'  # noqa
    DC_NS = '{http://purl.org/dc/elements/1.1/}'  # noqa
    DCT_NS = '{http://purl.org/dc/terms/}'  # noqa

    def parse_ooxml_core(self, file_path):
        try:
            with ZipFile(file_path) as zf:
                zf.getinfo(self.PROP_FILE)
                with zf.open(self.PROP_FILE, 'r') as xml:
                    return self.parse_xml_path(xml)
        except KeyError:  # missing the PROP_FILE
            return None
        except (BadZipfile, IOError):
            log.warning("Cannot read OOXML metadata: %s", file_path)
            return None

    def ooxml_extract_metadata(self, file_path, entity):
        doc = self.parse_ooxml_core(file_path)
        if doc is None:
            # TODO: should this trigger a ProcessingExc on the whole doc?
            return

        def get(ns, name):
            return doc.findtext('.//%s%s' % (ns, name))

        entity.add('title', get(self.DC_NS, 'title'))
        entity.add('summary', get(self.DC_NS, 'description'))
        entity.add('author', get(self.DC_NS, 'creator'))
        entity.add('author', get(self.CP_NS, 'lastModifiedBy'))

        created_at = self.parse_timestamp(get(self.DCT_NS, 'created'))
        entity.add('authoredAt', created_at)

        modified_at = self.parse_timestamp(get(self.DCT_NS, 'modified'))
        entity.add('modifiedAt', modified_at)

    @classmethod
    def inspect_ooxml_manifest(cls, file_path):
        if not zipfile.is_zipfile(file_path):
            return False
        try:
            with zipfile.ZipFile(file_path, 'r') as zf:
                manifest = zf.open('[Content_Types].xml').read()
                for mime_type in cls.MIME_TYPES:
                    if mime_type.encode() in manifest:
                        return True
        except Exception:
            return False
