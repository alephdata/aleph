from __future__ import absolute_import
import os
import logging
from cronos.parser import parse_structure, parse_data

from aleph.ingest.bundler import BundleIngestor
from aleph.ingest.tabular import TabularIngestor

log = logging.getLogger(__name__)


class CronosIngestor(TabularIngestor, BundleIngestor):
    BUNDLE_MIME = 'application/x-cronos-inform'
    BUNDLE_EXTENSION = 'cronos'
    FILES = ['CroBank.dat', 'CroBank.tad', 'CroStru.dat',
             'CroStru.tad', 'CroIndex.dat', 'CroIndex.tad']

    def find_file(self, directory, name):
        simple_name = name.strip().lower()
        for file_name in os.listdir(directory):
            if simple_name == file_name.strip().lower():
                return file_name

    def bundle(self, meta, directory):
        matches = []
        for search_name in self.FILES:
            name = self.find_file(directory, search_name)
            if name is not None:
                matches.append(name)
        if len(matches) >= 3:
            self.emit_bundle(meta, directory, matches)
        return matches

    def ingest_directory(self, meta, data_dir):
        stru_dat = self.find_file(data_dir, 'CroStru.dat')
        data_tad = self.find_file(data_dir, 'CroBank.tad')
        data_dat = self.find_file(data_dir, 'CroBank.dat')
        db, tables = parse_structure(os.path.join(data_dir, stru_dat))
        tables = [t for t in tables if t['abbr'] != 'FL']
        if not len(tables):
            return
        meta.title = db['BankName']
        document = self.create_document(meta)
        tabulars = []
        sheet = 0
        for table in tables:
            tabular = self.create_tabular(sheet, table['name'])
            columns = [c.get('name') for c in table.get('columns')]
            columns = [tabular.add_column(c) for c in columns]

            def generate_rows():
                for row in parse_data(os.path.join(data_dir, data_tad),
                                      os.path.join(data_dir, data_dat),
                                      table.get('id'), columns):
                    yield {c.name: v for c, v in zip(columns, row)}

            document.insert_records(sheet, generate_rows())
            tabulars.append(tabular)
            sheet += 1
        meta.tables = tabulars
        document.meta = meta
        self.emit(document)
