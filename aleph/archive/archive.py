import os


class Archive(object):

    def _get_prefix(self, content_hash):
        if content_hash is not None:
            return os.path.join(content_hash[:2],
                                content_hash[2:4],
                                content_hash[4:6],
                                content_hash)

    def upgrade(self):
        """Run maintenance on the store."""
        pass

    def archive_file(self, file_path, content_hash=None):
        """Import the given file into the archive."""
        pass

    def load_file(self, content_hash, file_name=None):
        pass

    def cleanup_file(self, content_hash):
        pass

    def generate_url(self, content_hash, file_name=None, mime_type=None):
        return
