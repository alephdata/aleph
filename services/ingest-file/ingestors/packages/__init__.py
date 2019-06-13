import bz2
import gzip
import shutil
import tarfile

from ingestors.ingestor import Ingestor
from ingestors.support.package import PackageSupport
from ingestors.support.shell import ShellSupport
from ingestors.exc import ProcessingException
from ingestors.util import join_path


class SevenZipIngestor(PackageSupport, Ingestor, ShellSupport):
    MIME_TYPES = [
        'application/x-7z-compressed',
        'application/7z-compressed'
    ]
    EXTENSIONS = [
        '7z',
        '7zip'
    ]
    SCORE = 4

    def unpack(self, file_path, temp_dir):
        self.exec_command('7z',
                          'x', file_path,
                          '-y',
                          '-r',
                          '-bb0',
                          '-bd',
                          '-oc:%s' % temp_dir)


class SingleFilePackageIngestor(PackageSupport, Ingestor):
    SCORE = 2

    def unpack(self, file_path, temp_dir):
        file_name = self.result.file_name or 'extracted'
        for ext in self.EXTENSIONS:
            ext = '.' + ext
            if file_name.endswith(ext):
                file_name = file_name[:len(file_name) - len(ext)]
        temp_file = join_path(temp_dir, file_name)
        self.unpack_file(file_path, temp_file)

    @classmethod
    def match(cls, file_path, entity):
        if tarfile.is_tarfile(file_path):
            return -1
        return super(SingleFilePackageIngestor, cls).match(file_path, entity)


class GzipIngestor(SingleFilePackageIngestor):
    MIME_TYPES = [
        'application/gzip',
        'application/x-gzip',
        'multipart/x-gzip'
    ]
    EXTENSIONS = [
        'gz',
        'tgz'
    ]

    def unpack_file(self, file_path, temp_file):
        try:
            with gzip.GzipFile(file_path) as src:
                with open(temp_file, 'wb') as dst:
                    shutil.copyfileobj(src, dst)
        except IOError as ioe:
            raise ProcessingException('Error: %s' % ioe)


class BZ2Ingestor(SingleFilePackageIngestor):
    MIME_TYPES = [
        'application/x-bzip',
        'application/x-bzip2',
        'multipart/x-bzip',
        'multipart/x-bzip2'
    ]
    EXTENSIONS = [
        'bz',
        'tbz',
        'bz2',
        'tbz2'
    ]

    def unpack_file(self, file_path, temp_file):
        try:
            with bz2.BZ2File(file_path) as src:
                with open(temp_file, 'wb') as dst:
                    shutil.copyfileobj(src, dst)
        except IOError as ioe:
            raise ProcessingException('Error: %s' % ioe)
