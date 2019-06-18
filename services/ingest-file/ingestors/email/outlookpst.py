import logging
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.temp import TempFileSupport
from ingestors.support.shell import ShellSupport
from ingestors.support.ole import OLESupport
from ingestors.directory import DirectoryIngestor

log = logging.getLogger(__name__)


class OutlookPSTIngestor(Ingestor, TempFileSupport, OLESupport, ShellSupport):
    MIME_TYPES = ['application/vnd.ms-outlook']
    EXTENSIONS = ['pst', 'ost', 'pab']
    BASE_SCORE = 5
    COMMAND_TIMEOUT = 12 * 60 * 60

    def ingest(self, file_path, entity):
        entity.schema = model.get('Package')
        self.extract_ole_metadata(file_path, entity)
        temp_dir = self.make_empty_directory()
        try:
            self.exec_command('readpst',
                              '-e',  # make subfolders, files per message
                              '-D',  # include deleted
                              '-r',  # recursive structure
                              '-8',  # utf-8 where possible
                              '-b',
                              '-q',  # quiet
                              '-o', temp_dir,
                              file_path)
            self.manager.delegate(DirectoryIngestor, temp_dir, entity)
        except Exception:
            log.exception("Failed to unpack PST.")
            # Handle partially extracted archives.
            self.manager.delegate(DirectoryIngestor, temp_dir, entity)
            raise
