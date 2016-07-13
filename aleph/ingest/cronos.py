from __future__ import absolute_import
import os
import shutil
import logging
from tempfile import mkdtemp
from cronos.parser import parse

from aleph.ingest import ingest_file
from aleph.ingest.bundler import BundleIngestor

log = logging.getLogger(__name__)


class CronosIngestor(BundleIngestor):
    BUNDLE_MIME = 'application/x-cronos-inform'
    BUNDLE_EXTENSION = 'cronos'
    FILES = ['CroBank.dat', 'CroBank.tad', 'CroStru.dat',
             'CroStru.tad', 'CroIndex.dat', 'CroIndex.tad']

    def bundle(self, meta, directory):
        matches = []
        for file_name in os.listdir(directory):
            for search_name in self.FILES:
                if search_name.lower().strip() == file_name.lower().strip():
                    matches.append(file_name)
        if len(matches) >= 3:
            self.emit_bundle(meta, directory, matches)
        return matches

    def ingest_directory(self, meta, temp_dir):
        out_dir = mkdtemp()
        try:
            parse(temp_dir, out_dir)
            for file_name in os.listdir(out_dir):
                file_path = os.path.join(out_dir, file_name)
                child = meta.make_child()
                child.file_name = file_name
                child.title = file_name[:len(file_name) - 4]
                ingest_file(self.collection_id, child, file_path)
        finally:
            shutil.rmtree(out_dir)
