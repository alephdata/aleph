import os
import logging
import shutil
import gzip
import bz2
import rarfile
import zipfile
import tarfile
from tempfile import mkdtemp

from aleph.ingest import ingest_file
from aleph.ingest.ingestor import Ingestor

log = logging.getLogger(__name__)


class PackageIngestor(Ingestor):

    def ingest(self, meta, local_path):
        temp_dir = mkdtemp()
        try:
            log.info("Descending into package: %r", meta.file_name)
            self.unpack(meta, local_path, temp_dir)
        finally:
            shutil.rmtree(temp_dir)

    def unpack(self, meta, local_path, temp_dir):
        pass

    def emit_file(self, meta, temp_path):
        meta = meta.clone()
        meta.data.pop('title', None)
        meta.data.pop('file_name', None)
        meta.data.pop('extension', None)
        meta.data.pop('mime_type', None)
        ingest_file(self.source_id, meta, temp_path)


class RARIngestor(PackageIngestor):

    def unpack(self, meta, local_path, temp_dir):
        with rarfile.RarFile(local_path) as rf:
            rf.extractall(path=temp_dir)
            for (dirname, _, files) in os.walk(temp_dir):
                for filename in files:
                    path = os.path.join(dirname, filename)
                    self.emit_file(meta, path)

    @classmethod
    def match(cls, meta, local_path):
        if rarfile.is_rarfile(local_path):
            return 10
        return -1


class ZipIngestor(PackageIngestor):

    def unpack(self, meta, local_path, temp_dir):
        with zipfile.ZipFile(local_path) as zf:
            zf.extractall(path=temp_dir)
            for (dirname, _, files) in os.walk(temp_dir):
                for filename in files:
                    path = os.path.join(dirname, filename)
                    self.emit_file(meta, path)

    @classmethod
    def match(cls, meta, local_path):
        if zipfile.is_zipfile(local_path):
            return 10
        return -1


class TarIngestor(PackageIngestor):

    def unpack(self, meta, local_path, temp_dir):
        with tarfile.TarFile(local_path) as tf:
            tf.extractall(path=temp_dir)
            for (dirname, _, files) in os.walk(temp_dir):
                for filename in files:
                    path = os.path.join(dirname, filename)
                    self.emit_file(meta, path)

    @classmethod
    def match(cls, meta, local_path):
        if tarfile.is_tarfile(local_path):
            return 10
        return -1


class SingleFilePackageIngestor(PackageIngestor):
    pass


class GzipIngestor(SingleFilePackageIngestor):
    MIME_TYPES = ['application/x-gzip', 'multipart/x-gzip']
    EXTENSIONS = ['gz', 'tgz']

    def unpack(self, meta, local_path, temp_dir):
        with tarfile.TarFile(local_path) as tf:
            tf.extractall(path=temp_dir)
            for (dirname, _, files) in os.walk(temp_dir):
                for filename in files:
                    path = os.path.join(dirname, filename)
                    self.emit_file(meta, path)


class Bz2Ingestor(SingleFilePackageIngestor):
    MIME_TYPES = ['application/x-bzip', 'application/x-bzip2',
                  'multipart/x-bzip', 'multipart/x-bzip2']
    EXTENSIONS = ['bz', 'tbz', 'b2', 'tbz2']

    def unpack(self, meta, local_path, temp_dir):
        with tarfile.TarFile(local_path) as tf:
            tf.extractall(path=temp_dir)
            for (dirname, _, files) in os.walk(temp_dir):
                for filename in files:
                    path = os.path.join(dirname, filename)
                    self.emit_file(meta, path)
