import os
import shutil
from ingestors.util import make_filename

from aleph.archive.archive import Archive
from aleph.util import checksum


class FileArchive(Archive):

    def __init__(self, config):
        self.path = config.get('ARCHIVE_PATH')
        if self.path is None:
            raise ValueError('No ARCHIVE_PATH is set.')

    def _locate_key(self, content_hash):
        prefix = self._get_prefix(content_hash)
        for file_name in os.listdir(prefix):
            return os.path.join(prefix, file_name)

    def archive_file(self, file_path, content_hash=None, move=False):
        """ Import the given file into the archive, and return an
        updated metadata object. If ``move`` is given, the original
        file will not exist afterwards. """
        if content_hash is None:
            content_hash = checksum(file_path)

        if self._locate_key(content_hash):
            if move:  # really?
                os.unlink(file_path)
            return content_hash

        file_name = make_filename(file_path, default='data')
        path = os.path.join(self._get_prefix(content_hash), file_name)
        try:
            os.makedirs(os.path.dirname(path))
        except:
            pass

        if move:
            shutil.move(file_path, path)
        else:
            shutil.copy(file_path, path)
        return content_hash

    def load_file(self, content_hash, file_name=None):
        return self._locate_key(content_hash)
