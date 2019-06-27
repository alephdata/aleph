import csv
import logging
from followthemoney.types import registry

from ingestors.support.temp import TempFileSupport

log = logging.getLogger(__name__)


class TableSupport(TempFileSupport):
    """Handle creating rows from an ingestor."""

    def emit_row_dicts(self, table, rows, headers=None):
        csv_path = self.make_work_file(table.id)
        row_count = 0
        with open(csv_path, 'w', encoding='utf-8') as fp:
            csv_writer = csv.writer(fp)
            for row in rows:
                if headers is None:
                    headers = list(row.keys())
                values = [row.get(h) for h in headers]
                csv_writer.writerow(values)
                # TODO: remove this in a few months...
                entity = self.manager.make_entity('Row')
                entity.make_id(table.id, row_count)
                entity.set('index', row_count)
                entity.set('cells', registry.json.pack(values))
                entity.set('table', table)
                self.manager.emit_entity(entity)
                # End remove.
                self.manager.emit_text_fragment(table, values, entity.id)
                row_count += 1
        csv_hash = self.manager.archive_store(csv_path)
        table.set('csvHash', csv_hash)
        table.set('rowCount', row_count + 1)
        table.set('columns', registry.json.pack(headers))

    def wrap_row_tuples(self, rows):
        for row in rows:
            headers = ['Column%s' % i for i in range(1, len(row) + 1)]
            yield dict(zip(headers, row))

    def emit_row_tuples(self, table, rows):
        return self.emit_row_dicts(table, self.wrap_row_tuples(rows))
