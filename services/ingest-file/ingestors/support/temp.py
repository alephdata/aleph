from uuid import uuid4

from ingestors.util import join_path, make_directory


class TempFileSupport(object):
    """Provides helpers for file system related tasks."""

    def make_empty_directory(self):
        return make_directory(self.manager.work_path, uuid4().hex)

    def make_work_file(self, file_name):
        return join_path(self.manager.work_path, file_name)
