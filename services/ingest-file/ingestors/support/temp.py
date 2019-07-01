from uuid import uuid4
from servicelayer.archive.util import ensure_path

from ingestors.exc import ProcessingException


class TempFileSupport(object):
    """Provides helpers for file system related tasks."""

    def make_empty_directory(self):
        directory_path = self.manager.work_path.joinpath(uuid4().hex)
        directory_path.mkdir()
        return directory_path

    def make_work_file(self, file_name, prefix=None):
        if prefix is not None:
            prefix = ensure_path(prefix)
            if self.manager.work_path not in prefix.parents:
                raise ProcessingException("Path escalation: %r" % prefix)
        prefix = prefix or self.manager.work_path
        work_file = prefix.joinpath(file_name)
        if prefix not in work_file.parents:
            raise ProcessingException("Path escalation: %r" % file_name)
        if not work_file.parent.exists():
            work_file.parent.mkdir(parents=True, exist_ok=True)
        return work_file
