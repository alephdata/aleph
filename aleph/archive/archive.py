import os
from aleph.util import checksum


class Archive(object):

    def _get_file_path(self, meta):
        ch = meta.content_hash
        if ch is None:
            raise ValueError("No content hash available.")
        path = os.path.join(ch[:2], ch[2:4], ch[4:6], ch)
        file_name = 'data'
        if meta.file_name is not None:
            file_name = meta.file_name
        else:
            if meta.extension is not None:
                file_name = '%s.%s' % (file_name, meta.extension)
        return os.path.join(path, file_name)

    def _update_metadata(self, filename, meta):
        meta.content_hash = checksum(filename)
        return meta

    def upgrade(self):
        """Run maintenance on the store."""
        pass

    def archive_file(self, filename, meta, move=False):
        """Import the given file into the archive.

        Return an updated metadata object. If ``move`` is given, the
        original file will not exist afterwards.
        """
        pass

    def load_file(self, meta):
        pass

    def cleanup_file(self, meta):
        pass

    def generate_url(self, meta):
        return
