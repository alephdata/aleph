import io
import logging
import os
import mimetypes

import requests
import zipstream

from followthemoney.export.csv import (
    write_entity as write_entity_csv, write_headers
)
from followthemoney.export.excel import (
    get_workbook, get_sheet, write_entity as write_entity_excel,
    get_workbook_content,
)


FORMAT_CSV = 'csv'
FORMAT_EXCEL = 'excel'


log = logging.getLogger(__name__)


def write_document(zip_archive, entity):
    parent = entity.context.get('collection')['label']
    name = entity.context.get('name')
    filetypes = entity.context.get('mimetypes')
    # is it a folder?
    if 'inode/directory' in filetypes:
        return
    ext = mimetypes.guess_extension(filetypes[0], strict=True)
    if ext:
        name = name + ext
    path = os.path.join(parent, name)

    file_url = entity.context['links'].get('file')
    if file_url:
        stream = requests.get(file_url, stream=True)
    zip_archive.write_iter(path, stream.iter_content())


def export_entity_csv(handlers, entity):
    fh = handlers.get(entity.schema.plural)
    if fh is None:
        handlers[entity.schema.plural] = fh = io.StringIO()
        write_headers(fh, entity.schema, extra_headers=['url'])
    if 'file' in entity.context['links']:
        url = entity.context['links']['file']
    else:
        url = entity.context['links']['ui']
    write_entity_csv(fh, entity, extra_fields={'url': url})


def export_entity_excel(workbook, entity):
    sheet = get_sheet(entity.schema, workbook, extra_headers=['url'])
    if 'file' in entity.context['links']:
        url = entity.context['links']['file']
    else:
        url = entity.context['links']['ui']
    write_entity_excel(sheet, entity, extra_fields={'url': url})


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
        zip_archive.write_iter('export.xls', content)
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
