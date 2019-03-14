import io
import os
import logging
import requests
import zipstream

from followthemoney.export.csv import (
    write_entity as write_entity_csv, write_headers
)
from followthemoney.export.excel import (
    get_workbook, write_entity as write_entity_excel,
    get_workbook_content,
)

from aleph.core import archive


FORMAT_CSV = 'csv'
FORMAT_EXCEL = 'excel'


log = logging.getLogger(__name__)


def _read_in_chunks(infile, chunk_size=1024*64):
    chunk = infile.read(chunk_size)
    while chunk:
        yield chunk
        chunk = infile.read(chunk_size)
    infile.close()


def write_document(zip_archive, entity):
    if not entity.has('contentHash', quiet=True):
        return
    # is it a folder?
    if 'inode/directory' in entity.get('mimeType', quiet=True):
        return
    collection = entity.context.get('collection')['label']
    name = entity.first('fileName') or entity.caption
    name = "{0}-{1}".format(entity.id, name)
    path = os.path.join(collection, name)
    content_hash = entity.first('contentHash')
    url = archive.generate_url(content_hash)
    if url is not None:
        stream = requests.get(url, stream=True)
        zip_archive.write_iter(path, stream.iter_content())
    else:
        try:
            local_path = archive.load_file(content_hash)
            if local_path is None:
                return
            stream = open(local_path, 'rb')
            # _read_in_chunks is evoked only after we start yielding the
            # contents of the zipfile. So we have to make sure the file
            # pointer stays open till then.
            zip_archive.write_iter(path, _read_in_chunks(stream))
        finally:
            archive.cleanup_file(content_hash)


def export_entity_csv(handlers, entity):
    fh = handlers.get(entity.schema.plural)
    if fh is None:
        handlers[entity.schema.plural] = fh = io.StringIO()
        write_headers(
            fh, entity.schema, extra_headers=['url', 'collection_url']
        )

    if 'file' in entity.context['links']:
        url = entity.context['links']['file']
    else:
        url = entity.context['links']['ui']
    collection_url = entity.context['collection']['links']['ui']
    write_entity_csv(fh, entity, extra_fields={
        'url': url, 'collection_url': collection_url
    })


def export_entity_excel(workbook, entity):
    if 'file' in entity.context['links']:
        url = entity.context['links']['file']
    else:
        url = entity.context['links']['ui']
    collection_url = entity.context['collection']['links']['ui']
    write_entity_excel(
        workbook, entity, extra_headers=['url', 'collection_url'],
        extra_fields={'url': url, 'collection_url': collection_url}
    )


def export_entities(entities, format):
    assert format in (FORMAT_CSV, FORMAT_EXCEL)
    zip_archive = zipstream.ZipFile()

    if format == FORMAT_EXCEL:
        workbook = get_workbook()
        for entity in entities:
            export_entity_excel(workbook, entity)
            if entity.schema.is_a('Document'):
                write_document(zip_archive, entity)
        content = io.BytesIO(get_workbook_content(workbook))
        zip_archive.write_iter('export.xlsx', content)
    elif format == FORMAT_CSV:
        handlers = {}
        for entity in entities:
            export_entity_csv(handlers, entity)
            if entity.schema.is_a('Document'):
                write_document(zip_archive, entity)

        for key in handlers:
            content = handlers[key]
            content.seek(0)
            content = io.BytesIO(content.read().encode())
            zip_archive.write_iter(key+'.csv', content)
    for chunk in zip_archive:
        yield chunk
