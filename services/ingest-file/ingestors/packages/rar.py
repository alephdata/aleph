import logging
import rarfile

from ingestors.ingestor import Ingestor
from ingestors.support.package import PackageSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class RARIngestor(PackageSupport, Ingestor):
    MIME_TYPES = [
        'application/rar'
        'application/x-rar'
    ]
    EXTENSIONS = [
        'rar'
    ]
    SCORE = 4

    def unpack(self, file_path, entity, temp_dir):
        # FIXME: need to figure out how to unpack multi-part files.
        try:
            with rarfile.RarFile(file_path.as_posix()) as rf:
                names = rf.namelist()
                encoding = self.detect_list_encoding(names)
                log.debug('Detected filename encoding: %s', encoding)

                for name in names:
                    try:
                        fh = rf.open(name)
                        self.extract_member(temp_dir, name, fh,
                                            encoding=encoding)
                    except Exception:
                        # TODO: should this be a fatal error?
                        log.exception("Failed to unpack: %r", name)
        except rarfile.NeedFirstVolume as nfv:
            raise ProcessingException('Cannot load RAR partials') from nfv
        except rarfile.PasswordRequired as pr:
            raise ProcessingException(str(pr)) from pr
        except (rarfile.Error, TypeError) as err:
            raise ProcessingException('Invalid RAR file: %s' % err) from err

    @classmethod
    def match(cls, file_path, entity):
        # doesn't accept pathlib.Path object
        if rarfile.is_rarfile(file_path.as_posix()):
            return cls.SCORE
        return super(RARIngestor, cls).match(file_path, entity)
