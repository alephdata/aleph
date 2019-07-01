import logging
import tarfile

from ingestors.ingestor import Ingestor
from ingestors.support.package import PackageSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class TarIngestor(PackageSupport, Ingestor):
    MIME_TYPES = [
        'application/tar',
        'application/x-tar',
        'application/x-tgz',
        'application/x-gtar'
    ]
    EXTENSIONS = [
        'tar'
    ]
    SCORE = 4

    def unpack(self, file_path, entity, temp_dir):
        try:
            with tarfile.open(name=file_path, mode='r:*') as tf:
                names = tf.getnames()
                encoding = self.detect_list_encoding(names,
                                                     default=tf.encoding)
                log.debug('Detected filename encoding: %s', encoding)

                for name in names:
                    try:
                        fh = tf.extractfile(name)
                        self.extract_member(temp_dir, name, fh,
                                            encoding=encoding)
                    except Exception as ex:
                        # TODO: should this be a fatal error?
                        log.debug("Failed to unpack [%r]: %s", name, ex)
        except (tarfile.TarError, IOError, EOFError) as err:
            raise ProcessingException('Invalid Tar file: %s' % err) from err

    @classmethod
    def match(cls, file_path, entity):
        if tarfile.is_tarfile(file_path):
            return cls.SCORE
        return super(TarIngestor, cls).match(file_path, entity)
