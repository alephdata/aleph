import io
import os
import logging
import requests
import zipstream
from followthemoney import model
from followthemoney.export.excel import (
    get_workbook, write_entity as write_entity_excel,
    get_workbook_content,
)

from aleph.core import archive
from aleph.logic import resolver
from aleph.model import Collection
from aleph.logic.util import entity_url

log = logging.getLogger(__name__)
EXTRA_HEADERS = ['url', 'collection']


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


def export_entities(request, result):
    entities = []
    for entity in result.results:
        resolver.queue(result, Collection, entity.get('collection_id'))
        entities.append(model.get_proxy(entity))
    resolver.resolve(result)
    zip_archive = zipstream.ZipFile()
    workbook = get_workbook()
    for entity in entities:
        collection_id = entity.context.get('collection_id')
        collection = resolver.get(result, Collection, collection_id)
        fields = {
            'url': entity_url(entity.id),
            'collection': collection.get('label'),
        }
        write_entity_excel(workbook, entity,
                           extra_fields=fields,
                           extra_headers=EXTRA_HEADERS)
        write_document(zip_archive, collection, entity)
    content = io.BytesIO(get_workbook_content(workbook))
    zip_archive.write_iter('export.xlsx', content)
    for chunk in zip_archive:
        yield chunk
