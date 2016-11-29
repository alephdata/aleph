import os
import six
import logging
import shutil
import gzip
import bz2
import rarfile
import zipfile
import tarfile
import subprocess
from chardet.universaldetector import UniversalDetector

from aleph.core import get_config
from aleph.ingest import ingest_directory
from aleph.ingest.ingestor import Ingestor
from aleph.util import make_tempdir, remove_tempdir

log = logging.getLogger(__name__)


class PackageIngestor(Ingestor):

    def unpack_members(self, pack, temp_dir):
        # Some archives come with non-Unicode file names, this
        # attempts to avoid that issue by naming the destination
        # explicitly.
        detector = UniversalDetector()
        for name in pack.namelist():
            if isinstance(name, six.binary_type):
                detector.feed(name)
            if detector.done:
                break

        detector.close()
        encoding = detector.result.get('encoding')
        if encoding in ['ascii', None]:
            encoding = 'utf-8'
        log.info('Detected filename encoding: %s', encoding)

        for name in pack.namelist():
            file_name = name
            if isinstance(name, six.binary_type):
                file_name = name.decode(encoding, 'ignore')

            out_path = os.path.join(temp_dir, file_name)
            if os.path.exists(out_path) or not out_path.startswith(temp_dir):
                continue

            out_dir = os.path.dirname(out_path)
            if not os.path.exists(out_dir):
                os.makedirs(out_dir)

            try:
                in_fh = pack.open(name)
                try:
                    log.debug("Unpack: %s", out_path)
                    with open(out_path, 'w') as out_fh:
                        shutil.copyfileobj(in_fh, out_fh)
                finally:
                    in_fh.close()
            except Exception as ex:
                log.debug("Failed to unpack %s: %s", out_path, ex)

    def ingest(self, meta, local_path):
        # Work-around: try to unpack multi-part files by changing into
        # the directory containing the file.
        prev_cwd = os.getcwd()
        os.chdir(os.path.dirname(local_path))
        temp_dir = make_tempdir(meta.file_name)
        try:
            log.info("Descending into package: %r", meta.file_name)
            self.unpack(meta, local_path, temp_dir)
            ingest_directory(self.collection_id, meta, temp_dir,
                             base_path=meta.foreign_id, move=True)
        except rarfile.NeedFirstVolume:
            pass
        finally:
            remove_tempdir(temp_dir)
            os.chdir(prev_cwd)

    def unpack(self, meta, local_path, temp_dir):
        pass


class RARIngestor(PackageIngestor):

    def unpack(self, meta, local_path, temp_dir):
        with rarfile.RarFile(local_path) as rf:
            self.unpack_members(rf, temp_dir)

    @classmethod
    def match(cls, meta, local_path):
        if rarfile.is_rarfile(local_path):
            return 4
        return -1


class ZipIngestor(PackageIngestor):

    def unpack(self, meta, local_path, temp_dir):
        with zipfile.ZipFile(local_path) as zf:
            self.unpack_members(zf, temp_dir)

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


class SevenZipIngestor(PackageIngestor):
    MIME_TYPES = ['application/x-7z-compressed']
    EXTENSIONS = ['7z', '7zip']
    BASE_SCORE = 4

    def unpack(self, meta, local_path, temp_dir):
        args = [get_config('SEVENZ_BIN'), 'x', local_path, '-y', '-r',
                '-bb0', '-bd', '-oc:%s' % temp_dir]
        subprocess.call(args, stderr=subprocess.STDOUT)


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
