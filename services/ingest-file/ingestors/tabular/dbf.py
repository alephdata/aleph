import logging
from dbf import Table, DbfError
from collections import OrderedDict
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.util import safe_string
from ingestors.exc import ProcessingException
from ingestors.support.table import TableSupport

log = logging.getLogger(__name__)


class DBFIngestor(Ingestor, TableSupport):
    MIME_TYPES = [
        'application/dbase',
        'application/x-dbase',
        'application/dbf',
        'application/x-dbf'
    ]
    EXTENSIONS = ['dbf']
    BASE_SCORE = 8

    def generate_rows(self, table):
        headers = [safe_string(h) for h in table.field_names]
        for row in table:
            try:
                data = OrderedDict()
                for header, value in zip(headers, row):
                    data[header] = safe_string(value)
                yield data
            except Exception as ex:
                log.warning("Cannot decode DBF row: %s", ex)

    def ingest(self, file_path, entity):
        entity.schema = model.get('Table')
        try:
            table = Table(file_path.as_posix()).open()
            self.emit_row_dicts(entity, self.generate_rows(table))
        except DbfError as err:
            raise ProcessingException('Cannot open DBF file: %s' % err)
