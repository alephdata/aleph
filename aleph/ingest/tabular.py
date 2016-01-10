import logging

from messytables import any_tableset, offset_processor
from messytables import headers_guess, headers_processor
from dbf.base import DBF
from extractors import guess_encoding

from aleph.model import Document
from aleph.util import string_value
from aleph.ingest.ingestor import Ingestor
from aleph.model.tabular import TabularSchema, Tabular

# TODO, dbf: https://pypi.python.org/pypi/pyDBF/
log = logging.getLogger(__name__)


class TabularIngestor(Ingestor):
    DOCUMENT_TYPE = Document.TYPE_TABULAR


class MessyTablesIngestor(TabularIngestor):
    MIME_TYPES = ['text/csv', 'application/excel', 'application/x-excel',
                  'application/vnd.ms-excel', 'application/x-msexcel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # noqa
                  'application/vnd.oasis.opendocument.spreadsheet',
                  'text/tab-separated-values']
    EXTENSIONS = ['csv', 'tsv', 'xls', 'xlsx', 'ods']
    BASE_SCORE = 6

    def generate_table(self, meta, sheet, row_set):
        offset, headers = headers_guess(row_set.sample)
        row_set.register_processor(headers_processor(headers))
        row_set.register_processor(offset_processor(offset + 1))
        schema = TabularSchema({
            'content_hash': meta.content_hash,
            'sheet': sheet
        })
        columns = [schema.add_column(h) for h in headers]
        log.info("Creating internal table: %s columns, table: %r", len(columns),
                 schema.table_name)
        tabular = Tabular(schema)
        tabular.drop()
        tabular.create()

        def generate_rows():
            for i, row in enumerate(row_set):
                record = {}
                for cell, column in zip(row, columns):
                    record[column.name] = string_value(cell.value)
                if len(record):
                    for column in columns:
                        record[column.name] = record.get(column.name, None)
                    yield record
            log.info("Loaded %s rows.", i)

        tabular.load_iter(generate_rows())
        return schema

    def ingest(self, meta, local_path):
        with open(local_path, 'rb') as fh:
            table_set = any_tableset(fh,
                                     extension=meta.extension,
                                     mimetype=meta.mime_type,
                                     window=20000)
            tables = []
            for sheet, row_set in enumerate(table_set.tables):
                tables.append(self.generate_table(meta, sheet, row_set))

            meta.tables = tables
            document = self.create_document(meta)
            self.emit(document)


class DBFIngestor(TabularIngestor):
    MIME_TYPES = []
    EXTENSIONS = ['dbf']

    def ingest(self, meta, local_path):
        with open(local_path, 'rb') as fh:
            db = DBF(fh)
            schema = TabularSchema({
                'content_hash': meta.content_hash,
                'sheet': 0
            })
            columns = [schema.add_column(h) for h in db.fields.keys()]
            columns = {c.label: c.name for c in columns}
            tabular = Tabular(schema)
            tabular.drop()
            tabular.create()

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

                log.info("Loaded %s rows.", i)

            tabular.load_iter(generate_rows())
            meta.tables = [schema]
            document = self.create_document(meta)
            self.emit(document)
