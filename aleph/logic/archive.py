# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

import logging

from aleph.core import archive
from aleph.model import Document, Export
from aleph.index.entities import checksums_count

log = logging.getLogger(__name__)


def _chunked_hashes(prefix, batch_size=500):
    batch = set()
    for content_hash in archive.list_files(prefix=prefix):
        batch.add(content_hash)
        if len(batch) >= batch_size:
            yield batch
            batch = set()
    if len(batch) > 0:
        yield batch


def cleanup_archive(prefix=None):
    """Clean up the blob archive behind aleph. Files inside of the archive
    are keyed on their SHA1 checksum, but the archive itself doesn't know
    what entities or exports a blob is linked to. So this is basically a
    garbage collector that needs to determine if any part of the database
    or index references the given hash. It's a messy process and it should
    be applied carefully."""
    for batch in _chunked_hashes(prefix):
        for content_hash, count in checksums_count(batch):
            if count > 0:
                # log.info("Used hash: %s", content_hash)
                continue
            # In theory, this is a redundant check. In practice, it's shit
            # to delete seed data from the docs table by accident:
            docs = Document.by_content_hash(content_hash)
            if docs.count() > 0:
                # log.info("Doc hash: %s", content_hash)
                continue
            exports = Export.by_content_hash(content_hash)
            if exports.count() > 0:
                continue
            # path = archive.load_file(content_hash)
            # log.info("Dangling hash [%s]: %s", content_hash, path)
            log.info("Dangling hash: %s", content_hash)
            archive.delete_file(content_hash)
