import logging
import zipfile

from ingestors.ingestor import Ingestor
from ingestors.support.package import PackageSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class ZipIngestor(PackageSupport, Ingestor):
    MIME_TYPES = [
        'application/zip',
        'application/x-zip',
        'multipart/x-zip',
        'application/zip-compressed',
        'application/x-zip-compressed',
    ]
    EXTENSIONS = [
        'zip'
    ]
    SCORE = 3

    def unpack(self, file_path, entity, temp_dir):
        try:
            with zipfile.ZipFile(file_path) as zf:
                names = zf.namelist()
                encoding = self.detect_list_encoding(names)
                log.debug('Detected filename encoding: %s', encoding)
                for name in names:
                    try:
                        info = zf.getinfo(name)
                        if info.is_dir():
                            continue

                        with zf.open(name) as fh:
                            self.extract_member(temp_dir, name, fh,
                                                encoding=encoding)
                    except Exception as ex:
                        # TODO: should this be a fatal error?
                        log.debug("Failed to unpack [%r]: %s", name, ex)
        except (zipfile.BadZipfile, OSError) as bzfe:
            raise ProcessingException('Invalid ZIP file: %s' % bzfe) from bzfe

    @classmethod
    def match(cls, file_path, entity):
        if zipfile.is_zipfile(file_path):
            return cls.SCORE
        return super(ZipIngestor, cls).match(file_path, entity)
