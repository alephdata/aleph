import io
import os
import logging
import requests
import zipstream
from followthemoney import model
from followthemoney.export.csv import (
    write_entity as write_entity_csv, write_headers
)
from followthemoney.export.excel import (
    get_workbook, write_entity as write_entity_excel,
    get_workbook_content,
)

from aleph.core import archive
from aleph.logic import resolver
from aleph.model import Collection
from aleph.logic.util import entity_url, collection_url

log = logging.getLogger(__name__)
FORMAT_CSV = 'csv'
FORMAT_EXCEL = 'excel'
EXTRA_HEADERS = ['url', 'collection', 'collection_url']


def write_document(zip_archive, collection, entity):
    if not entity.has('contentHash', quiet=True):
        return
    name = entity.first('fileName') or entity.caption
    name = "{0}-{1}".format(entity.id, name)
    path = os.path.join(collection.get('label'), name)
    content_hash = entity.first('contentHash')
    url = archive.generate_url(content_hash)
    if url is not None:
        stream = requests.get(url, stream=True)
        zip_archive.write_iter(path, stream.iter_content())
    else:
        local_path = archive.load_file(content_hash)
        if local_path is not None:
            zip_archive.write(local_path, arcname=path)


def export_entity_csv(handlers, collection, entity):
    fh = handlers.get(entity.schema.plural)
    if fh is None:
        handlers[entity.schema.plural] = fh = io.StringIO()
        write_headers(fh, entity.schema,
                      extra_headers=EXTRA_HEADERS)
    write_entity_csv(fh, entity, extra_fields={
        'url': entity_url(entity.id),
        'collection': collection.get('label'),
        'collection_url': collection_url(collection.get('id'))
    })


def export_entity_excel(workbook, collection, entity):
    fields = {
        'url': entity_url(entity.id),
        'collection': collection.get('label'),
        'collection_url': collection_url(collection.get('id'))
    }
    write_entity_excel(workbook, entity,
                       extra_fields=fields,
                       extra_headers=EXTRA_HEADERS)


def export_entities(request, result, format):
    assert format in (FORMAT_CSV, FORMAT_EXCEL)
    entities = []
    for entity in result.results:
        resolver.queue(result, Collection, entity.get('collection_id'))
        entities.append(model.get_proxy(entity))
    resolver.resolve(result)
    zip_archive = zipstream.ZipFile()

    if format == FORMAT_EXCEL:
        workbook = get_workbook()
        for entity in entities:
            collection_id = entity.context.get('collection_id')
            collection = resolver.get(result, Collection, collection_id)
            export_entity_excel(workbook, collection, entity)
            write_document(zip_archive, collection, entity)
        content = io.BytesIO(get_workbook_content(workbook))
        zip_archive.write_iter('export.xlsx', content)
    elif format == FORMAT_CSV:
        handlers = {}
        for entity in entities:
            collection_id = entity.context.get('collection_id')
            collection = resolver.get(result, Collection, collection_id)
            export_entity_csv(handlers, collection, entity)
            write_document(zip_archive, collection, entity)

        for key in handlers:
            content = handlers[key]
            content.seek(0)
            content = io.BytesIO(content.read().encode())
            zip_archive.write_iter(key+'.csv', content)
    for chunk in zip_archive:
        yield chunk
