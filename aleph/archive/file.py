import os
import shutil

from aleph.archive.archive import Archive


class FileArchive(Archive):

    def __init__(self, config):
        self.path = config.get('ARCHIVE_PATH')
        if self.path is None:
            raise ValueError('No ARCHIVE_PATH is set.')

    def _get_local_path(self, meta):
        return os.path.join(self.path, self._get_file_path(meta))

    def archive_file(self, filename, meta, move=False):
        """ Import the given file into the archive, and return an
        updated metadata object. If ``move`` is given, the original
        file will not exist afterwards. """
        meta = self._update_metadata(filename, meta)
        path = self._get_local_path(meta)
        if os.path.isfile(path):
            if move:  # really?
                os.unlink(filename)
            return meta
        try:
            os.makedirs(os.path.dirname(path))
        except:
            pass
        if move:
            shutil.move(filename, path)
        else:
            shutil.copy(filename, path)
        return meta

    def load_file(self, meta):
        return self._get_local_path(meta)
