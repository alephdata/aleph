import shutil
import logging
from followthemoney import model

from ingestors.support.temp import TempFileSupport
from ingestors.support.encoding import EncodingSupport
from ingestors.directory import DirectoryIngestor

log = logging.getLogger(__name__)


class PackageSupport(TempFileSupport, EncodingSupport):

    def ensure_path(self, base_dir, name, encoding='utf-8'):
        if isinstance(name, bytes):
            name = name.decode(encoding, 'ignore')
        return self.make_work_file(name, prefix=base_dir)

    def extract_member(self, base_dir, name, fh, encoding):
        out_path = self.ensure_path(base_dir, name, encoding=encoding)
        if out_path is None:
            return
        file_name = out_path.name
        try:
            log.debug("Unpack: %s", file_name)
            with open(out_path, 'wb') as out_fh:
                shutil.copyfileobj(fh, out_fh)
        finally:
            fh.close()

    def ingest(self, file_path, entity):
        entity.schema = model.get('Package')
        temp_dir = self.make_empty_directory()
        self.unpack(file_path, temp_dir)
        self.manager.delegate(DirectoryIngestor, temp_dir, entity)

    def unpack(self, file_path, temp_dir):
        pass
