import csv
import logging
from pantomime.types import CSV
from collections import OrderedDict
from followthemoney.types import registry
from followthemoney.util import sanitize_text

from ingestors.support.temp import TempFileSupport

log = logging.getLogger(__name__)


class TableSupport(TempFileSupport):
    """Handle creating rows from an ingestor."""

    def emit_row_dicts(self, table, rows, headers=None):
        csv_path = self.make_work_file(table.id)
        row_count = 0
        with open(csv_path, 'w', encoding='utf-8') as fp:
            csv_writer = csv.writer(fp, dialect='unix')
            for row in rows:
                if headers is None:
                    headers = list(row.keys())
                values = [sanitize_text(row.get(h)) for h in headers]
                csv_writer.writerow(values)
                self.manager.emit_text_fragment(table, values, row_count)
                row_count += 1
        if row_count > 0:
            csv_hash = self.manager.store(csv_path, mime_type=CSV)
            table.set('csvHash', csv_hash)
        table.set('rowCount', row_count + 1)
        table.set('columns', registry.json.pack(headers))

    def wrap_row_tuples(self, rows):
        for row in rows:
            headers = ['Column %s' % i for i in range(1, len(row) + 1)]
            yield OrderedDict(zip(headers, row))

    def emit_row_tuples(self, table, rows):
        return self.emit_row_dicts(table, self.wrap_row_tuples(rows))
