from __future__ import absolute_import
from dbf.base import DBF
from aleph.text import string_value
from aleph.ingest.tabular import TabularIngestor

# TODO, dbf: https://pypi.python.org/pypi/pyDBF/


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

                for i in xrange(0, db.numrec):
                    row = db.select(i)
                    record = {}
                    for k, value in row.items():
                        name = columns.get(k)
                        record[name] = string_value(value)
                    if len(record):
                        for name in columns.values():
                            record[name] = record.get(name, None)
                        yield record

            document.insert_records(0, generate_rows())
            meta.tables = [tabular]
            document.meta = meta
            self.emit(document)
