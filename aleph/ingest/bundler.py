import os
import logging
from zipfile import ZipFile, ZIP_STORED

from aleph.ingest import ingest_file
from aleph.ingest.ingestor import Ingestor
from aleph.util import make_tempdir, remove_tempdir

log = logging.getLogger(__name__)


class BundleIngestor(Ingestor):
    BUNDLE_MIME = None
    BUNDLE_EXTENSION = None
    BASE_SCORE = 10

    def emit_bundle(self, meta, directory, files):
        bundle = meta.make_child()
        if meta.foreign_id:
            bundle.source_path = os.path.join(meta.foreign_id,
                                              self.BUNDLE_EXTENSION)
        bundle.mime_type = self.BUNDLE_MIME
        bundle.file_name = '%s.%s' % (meta.file_name,
                                      self.BUNDLE_EXTENSION)
        log.info("Creating bundle: %r", bundle.file_name)
        temp_dir = make_tempdir()
        try:
            bundle_path = os.path.join(temp_dir, bundle.file_name)
            with ZipFile(bundle_path, 'w', ZIP_STORED) as zf:
                for file_name in files:
                    file_path = os.path.join(directory, file_name)
                    zf.write(file_path, file_name)
            ingest_file(self.collection_id, bundle, bundle_path,
                        move=True)
        finally:
            remove_tempdir(temp_dir)

    def bundle(self, meta, directory):
        return []

    def ingest(self, meta, local_path):
        temp_dir = make_tempdir()
        try:
            log.info("Unpacking bundle: %r", meta.file_name)
            with ZipFile(local_path, 'r') as zf:
                zf.extractall(temp_dir)
            self.ingest_directory(meta, temp_dir)
        finally:
            remove_tempdir(temp_dir)

    def ingest_directory(self, meta, temp_dir):
        raise NotImplemented()

    @classmethod
    def match(cls, meta, local_path):
        if meta.mime_type == cls.BUNDLE_MIME:
            return cls.BASE_SCORE
        return -1
