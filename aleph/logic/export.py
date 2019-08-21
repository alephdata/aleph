import os
import logging
import requests
import zipstream
from followthemoney import model
from followthemoney.export.excel import ExcelExporter

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
    exporter = ExcelExporter(None, extra=EXTRA_HEADERS)
    for entity in entities:
        collection_id = entity.context.get('collection_id')
        collection = resolver.get(result, Collection, collection_id)
        extra = [entity_url(entity.id), collection.get('label')]
        exporter.write(entity, extra=extra)
        write_document(zip_archive, collection, entity)
    content = exporter.get_bytesio()
    zip_archive.write_iter('Export.xlsx', content)
    for chunk in zip_archive:
        yield chunk
