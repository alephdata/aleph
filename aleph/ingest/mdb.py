import logging
import subprocess
from unicodecsv import DictReader

from aleph.core import get_config
from aleph.ingest.tabular import TabularIngestor

log = logging.getLogger(__name__)


class AccessIngestor(TabularIngestor):
    MIME_TYPES = ['application/msaccess', 'application/x-msaccess',
                  'application/vnd.msaccess', 'application/vnd.ms-access',
                  'application/mdb', 'application/x-mdb']
    EXTENSIONS = ['mdb']
    BASE_SCORE = 7

    def get_tables(self, local_path):
        mdb_tables = get_config('MDB_TABLES_BIN')
        output = subprocess.check_output([mdb_tables, local_path])
        return [t.strip() for t in output.split(' ') if len(t.strip())]

    def iter_table(self, local_path, table_name):
        mdb_export = get_config('MDB_EXPORT_BIN')
        args = [mdb_export, '-b', 'strip', local_path, table_name]
        proc = subprocess.Popen(args, stdout=subprocess.PIPE)
        for row in DictReader(proc.stdout):
            yield row

    def load_table(self, document, local_path, table_name, sheet):
        log.info("Loading table: %s (%s)", table_name, sheet)
        tabular = self.create_tabular(sheet, table_name)
        columns = []

        def generate_rows():
            for row in self.iter_table(local_path, table_name):
                if not len(columns):
                    columns.extend([tabular.add_column(c) for c in row.keys()])
                yield {c.name: row.get(c.label) for c in columns}

        document.insert_records(sheet, generate_rows())
        return tabular

    def ingest(self, meta, local_path):
        document = self.create_document(meta)
        tables = []
        for i, table_name in enumerate(self.get_tables(local_path)):
            tables.append(self.load_table(document, local_path,
                                          table_name, i))
        meta.tables = tables
        document.meta = meta
        self.emit(document)
