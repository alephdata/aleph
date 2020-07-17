import logging
from pprint import pprint  # noqa
from olefile import isOleFile, OleFileIO

from ingestors.support.timestamp import TimestampSupport
from ingestors.support.encoding import EncodingSupport

log = logging.getLogger(__name__)


class OLESupport(TimestampSupport, EncodingSupport):
    """Provides helpers for Microsoft OLE files."""

    def decode_meta(self, meta, prop):
        try:
            value = getattr(meta, prop, None)
            if not isinstance(value, bytes):
                return
            encoding = "cp%s" % meta.codepage
            return self.decode_string(value, encoding)
        except Exception:
            log.warning("Could not read metadata: %s", prop)

    def extract_ole_metadata(self, file_path, entity):
        with open(file_path, "rb") as fh:
            if not isOleFile(fh):
                return
            fh.seek(0)
            try:
                ole = OleFileIO(fh)
                self.extract_olefileio_metadata(ole, entity)
            except (RuntimeError, IOError):
                # OLE reading can go fully recursive, at which point it's OK
                # to just eat this runtime error quietly.
                log.warning("Failed to read OLE data: %r", entity)
            except Exception:
                log.exception("Failed to read OLE data: %r", entity)

    def extract_olefileio_metadata(self, ole, entity):
        try:
            entity.add("authoredAt", self.parse_timestamp(ole.root.getctime()))
        except Exception:
            log.warning("Failed to parse OLE ctime.")
        try:
            entity.add("modifiedAt", self.parse_timestamp(ole.root.getmtime()))
        except Exception:
            log.warning("Failed to parse OLE mtime.")

        meta = ole.get_metadata()
        entity.add("title", self.decode_meta(meta, "title"))
        entity.add("author", self.decode_meta(meta, "author"))
        entity.add("author", self.decode_meta(meta, "last_saved_by"))
        entity.add("author", self.decode_meta(meta, "company"))
        entity.add("summary", self.decode_meta(meta, "notes"))
        entity.add("generator", self.decode_meta(meta, "creating_application"))
        entity.add("authoredAt", self.decode_meta(meta, "create_time"))
        entity.add("modifiedAt", self.decode_meta(meta, "last_saved_time"))
        entity.add("language", self.decode_meta(meta, "language"))
