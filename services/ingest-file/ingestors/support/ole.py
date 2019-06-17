import logging
from olefile import isOleFile, OleFileIO

from ingestors.support.timestamp import TimestampSupport

log = logging.getLogger(__name__)


class OLESupport(TimestampSupport):
    """Provides helpers for Microsoft OLE files."""

    def extract_ole_metadata(self, file_path, entity):
        with open(file_path, 'rb') as fh:
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
            entity.add('authoredAt', self.parse_timestamp(ole.root.getctime()))
        except Exception:
            log.warning("Failed to parse OLE ctime.")
        try:
            entity.add('modifiedAt', self.parse_timestamp(ole.root.getmtime()))
        except Exception:
            log.warning("Failed to parse OLE mtime.")

        try:
            meta = ole.get_metadata()
            entity.add('title', meta.title)
            entity.add('author', meta.author)
            entity.add('author', meta.last_saved_by)
            entity.add('author', meta.company)
            entity.add('summary', meta.notes)
            entity.add('generator', meta.creating_application)
            entity.add('authoredAt', self.parse_timestamp(meta.create_time))
            entity.add('modifiedAt', self.parse_timestamp(meta.last_saved_time))  # noqa
            entity.add('language', meta.language)

        except Exception:
            log.exception("OLE parsing error.")
