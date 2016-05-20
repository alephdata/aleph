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

    def emit_member(self, meta, name, fh, temp_dir):
        file_name = os.path.basename(os.path.normpath(name))
        file_path = os.path.join(temp_dir, file_name)
        child = meta.clone()
        child.clear('title')
        child.clear('extension')
        child.clear('file_name')
        child.clear('content_hash')
        child.clear('mime_type')
        child.clear('foreign_id')
        child.parent = meta.clone()
        child.file_name = file_name
        child.source_path = name
        child.foreign_id = '%s:%s' % (meta.foreign_id, name)

        with open(file_path, 'wb') as dst:
            shutil.copyfileobj(fh, dst)
        ingest_file(self.source_id, child, file_path, move=True)


class RARIngestor(PackageIngestor):

    def unpack(self, meta, local_path, temp_dir):
        with rarfile.RarFile(local_path) as rf:
            for info in rf.infolist():
                if info.file_size == 0:
                    continue
                fh = rf.open(info)
                self.emit_member(meta, info.filename, fh, temp_dir)

    @classmethod
    def match(cls, meta, local_path):
        if rarfile.is_rarfile(local_path):
            return 4
        return -1


class ZipIngestor(PackageIngestor):

    def unpack(self, meta, local_path, temp_dir):
        with zipfile.ZipFile(local_path) as zf:
            for info in zf.infolist():
                if info.file_size == 0:
                    continue
                fh = zf.open(info)
                self.emit_member(meta, info.filename, fh, temp_dir)

    @classmethod
    def match(cls, meta, local_path):
        if zipfile.is_zipfile(local_path):
            return 3
        return -1


class TarIngestor(PackageIngestor):

    def unpack(self, meta, local_path, temp_dir):
        with tarfile.open(name=local_path, mode='r:*') as tf:
            for member in tf:
                if not member.isfile():
                    continue
                fh = tf.extractfile(member)
                self.emit_member(meta, member.name, fh, temp_dir)

    @classmethod
    def match(cls, meta, local_path):
        if tarfile.is_tarfile(local_path):
            return 4
        return -1


class SingleFilePackageIngestor(PackageIngestor):
    BASE_SCORE = 2

    def emit_file(self, meta, file_path):
        ingest_file(self.source_id, meta, file_path)

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
        self.emit_file(meta, temp_file)


class BZ2Ingestor(SingleFilePackageIngestor):
    MIME_TYPES = ['application/x-bzip', 'application/x-bzip2',
                  'multipart/x-bzip', 'multipart/x-bzip2']
    EXTENSIONS = ['bz', 'tbz', 'bz2', 'tbz2']

    def unpack_file(self, meta, local_path, temp_file):
        with bz2.BZ2File(local_path) as src:
            with open(temp_file, 'wb') as dst:
                shutil.copyfileobj(src, dst)
        self.emit_file(meta, temp_file)
