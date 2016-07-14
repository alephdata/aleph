import os
import logging
import shutil
import gzip
import bz2
import rarfile
import zipfile
import tarfile
from tempfile import mkdtemp

from aleph.ingest import ingest_directory
from aleph.ingest.ingestor import Ingestor

log = logging.getLogger(__name__)


class PackageIngestor(Ingestor):

    def ingest(self, meta, local_path):
        temp_dir = mkdtemp()
        try:
            log.info("Descending into package: %r", meta.file_name)
            self.unpack(meta, local_path, temp_dir)
            ingest_directory(self.collection_id, meta, temp_dir,
                             base_path=meta.foreign_id, move=True)
        except rarfile.NeedFirstVolume:
            pass
        finally:
            shutil.rmtree(temp_dir)

    def unpack(self, meta, local_path, temp_dir):
        pass


class RARIngestor(PackageIngestor):

    def unpack(self, meta, local_path, temp_dir):
        with rarfile.RarFile(local_path) as rf:
            rf.extractall(temp_dir)

    @classmethod
    def match(cls, meta, local_path):
        if rarfile.is_rarfile(local_path):
            return 4
        return -1


class ZipIngestor(PackageIngestor):

    def unpack(self, meta, local_path, temp_dir):
        with zipfile.ZipFile(local_path) as zf:
            zf.extractall(temp_dir)

    @classmethod
    def match(cls, meta, local_path):
        if zipfile.is_zipfile(local_path):
            return 3
        return -1


class TarIngestor(PackageIngestor):

    def unpack(self, meta, local_path, temp_dir):
        with tarfile.open(name=local_path, mode='r:*') as tf:
            tf.extractall(temp_dir)

    @classmethod
    def match(cls, meta, local_path):
        if tarfile.is_tarfile(local_path):
            return 4
        return -1


class SingleFilePackageIngestor(PackageIngestor):
    BASE_SCORE = 2

    def unpack(self, meta, local_path, temp_dir):
        file_name = meta.file_name
        for ext in self.EXTENSIONS:
            ext = '.' + ext
            if file_name.endswith(ext):
                file_name = file_name[:len(file_name) - len(ext)]
        temp_file = os.path.join(temp_dir, file_name)
        self.unpack_file(meta, local_path, temp_file)

    @classmethod
    def match(cls, meta, local_path):
        if tarfile.is_tarfile(local_path):
            return -1
        return super(SingleFilePackageIngestor, cls).match(meta, local_path)


class GzipIngestor(SingleFilePackageIngestor):
    MIME_TYPES = ['application/x-gzip', 'multipart/x-gzip']
    EXTENSIONS = ['gz', 'tgz']

    def unpack_file(self, meta, local_path, temp_file):
        with gzip.GzipFile(local_path) as src:
            with open(temp_file, 'wb') as dst:
                shutil.copyfileobj(src, dst)


class BZ2Ingestor(SingleFilePackageIngestor):
    MIME_TYPES = ['application/x-bzip', 'application/x-bzip2',
                  'multipart/x-bzip', 'multipart/x-bzip2']
    EXTENSIONS = ['bz', 'tbz', 'bz2', 'tbz2']

    def unpack_file(self, meta, local_path, temp_file):
        with bz2.BZ2File(local_path) as src:
            with open(temp_file, 'wb') as dst:
                shutil.copyfileobj(src, dst)
