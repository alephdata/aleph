import os
import io
import csv
import logging
import subprocess
from collections import OrderedDict
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.shell import ShellSupport
from ingestors.support.table import TableSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class AccessIngestor(Ingestor, TableSupport, ShellSupport):
    MIME_TYPES = [
        'application/msaccess',
        'application/x-msaccess',
        'application/vnd.msaccess',
        'application/vnd.ms-access',
        'application/mdb',
        'application/x-mdb'
    ]
    EXTENSIONS = ['mdb']
    SCORE = 8

    def get_tables(self, local_path):
        mdb_tables = self.find_command('mdb-tables')
        if mdb_tables is None:
            raise RuntimeError('mdb-tools is not available')
        try:
            output = subprocess.check_output([mdb_tables, local_path])
            return [
                t.strip().decode('utf-8')
                for t in output.split(b' ') if len(t.strip())
            ]
        except subprocess.CalledProcessError as cpe:
            log.warning("Failed to open MDB: %s", cpe)
            raise ProcessingException("Failed to extract Access DB.") from cpe

    def generate_rows(self, file_path, table_name):
        mdb_export = self.find_command('mdb-export')
        if mdb_export is None:
            raise RuntimeError('mdb-tools is not available')
        args = [mdb_export, '-b', 'strip', file_path, table_name]
        proc = subprocess.Popen(args, stdout=subprocess.PIPE)
        output = io.TextIOWrapper(proc.stdout, newline=os.linesep)
        headers = None
        for row in csv.reader((line for line in output), delimiter=","):
            if headers is None:
                headers = row
                continue
            yield OrderedDict(zip(headers, row))

    def ingest(self, file_path, entity):
        entity.schema = model.get('Workbook')
        for table_name in self.get_tables(file_path):
            table = self.manager.make_entity('Table', parent=entity)
            table.make_id(entity, table_name)
            table.set('title', table_name)
            rows = self.generate_rows(file_path, table_name)
            self.emit_row_dicts(table, rows)
            self.manager.emit_entity(table)
