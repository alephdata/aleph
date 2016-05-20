import logging

from messytables import any_tableset, offset_processor
from messytables import headers_guess, headers_processor

from aleph.metadata import Tabular
from aleph.model import Document
from aleph.text import string_value
from aleph.ingest.ingestor import Ingestor

log = logging.getLogger(__name__)


class TabularIngestor(Ingestor):
    DOCUMENT_TYPE = Document.TYPE_TABULAR

    def create_document(self, meta, type=None):
        document = super(TabularIngestor, self).create_document(meta,
                                                                type=type)
        document.delete_records()
        return document

    def create_tabular(self, sheet, sheet_name=None):
        return Tabular({
            'sheet_name': sheet_name,
            'sheet': sheet
        })


class MessyTablesIngestor(TabularIngestor):
    MIME_TYPES = ['text/csv', 'application/excel', 'application/x-excel',
                  'application/vnd.ms-excel', 'application/x-msexcel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # noqa
                  'application/vnd.oasis.opendocument.spreadsheet',
                  'text/tab-separated-values']
    EXTENSIONS = ['csv', 'tsv', 'xls', 'xlsx', 'ods']
    BASE_SCORE = 4

    def generate_table(self, document, meta, sheet, row_set):
        offset, headers = headers_guess(row_set.sample)
        row_set.register_processor(headers_processor(headers))
        row_set.register_processor(offset_processor(offset + 1))
        tabular = self.create_tabular(sheet, row_set.name)
        columns = [tabular.add_column(h) for h in headers]
        if not len(columns):
            return

        def generate_rows():
            for i, row in enumerate(row_set):
                record = {}
                try:
                    for cell, column in zip(row, columns):
                        record[column.name] = string_value(cell.value)
                    if len(record):
                        for column in columns:
                            record[column.name] = record.get(column.name, None)
                        yield record
                except Exception as exception:
                    log.warning("Could not decode row %s in %s: %s",
                                i, meta, exception)

        document.insert_records(sheet, generate_rows())
        return tabular

    def ingest(self, meta, local_path):
        with open(local_path, 'rb') as fh:
            table_set = any_tableset(fh,
                                     extension=meta.extension,
                                     mimetype=meta.mime_type,
                                     window=20000)
            tables = []
            document = self.create_document(meta)
            for sheet, row_set in enumerate(table_set.tables):
                tables.append(self.generate_table(document, meta, sheet,
                                                  row_set))

            meta.tables = tables
            document.meta = meta
            self.emit(document)
