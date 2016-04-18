import logging

from messytables import any_tableset, offset_processor
from messytables import headers_guess, headers_processor
from dbf.base import DBF
from extractors import guess_encoding

from aleph.model import Document
from aleph.util import string_value
from aleph.ingest.ingestor import Ingestor
from aleph.model.tabular import Tabular

# TODO, dbf: https://pypi.python.org/pypi/pyDBF/
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
    EXTENSIONS = ['csv', 'tsv', 'xls', 'xlsx', 'ods', 'rtf']
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
            for row in row_set:
                record = {}
                try:
                    for cell, column in zip(row, columns):
                        record[column.name] = string_value(cell.value)
                    if len(record):
                        for column in columns:
                            record[column.name] = record.get(column.name, None)
                        yield record
                except Exception as exception:
                    self.log_exception(meta, exception)

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


class DBFIngestor(TabularIngestor):
    MIME_TYPES = []
    EXTENSIONS = ['dbf']
    BASE_SCORE = 7

    def ingest(self, meta, local_path):
        with open(local_path, 'rb') as fh:
            db = DBF(fh)
            document = self.create_document(meta)
            tabular = self.create_tabular(0)
            columns = [tabular.add_column(h) for h in db.fields.keys()]
            if not len(columns):
                return
            columns = {c.label: c.name for c in columns}

            def generate_rows():
                if db.numrec == 0:
                    return
                text = []
                for i in xrange(0, db.numrec):
                    for v in db.select(i).values():
                        if isinstance(v, str):
                            text.append(v)
                encoding = guess_encoding(' '.join(text))

                for i in xrange(0, db.numrec):
                    row = db.select(i)
                    record = {}
                    for k, value in row.items():
                        name = columns.get(k)
                        record[name] = string_value(value, encoding=encoding)
                    if len(record):
                        for name in columns.values():
                            record[name] = record.get(name, None)
                        yield record

            document.insert_records(0, generate_rows())
            meta.tables = [tabular]
            document.meta = meta
            self.emit(document)
