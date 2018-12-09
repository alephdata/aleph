import logging
from pprint import pprint  # noqa

from aleph.index.records import index_records, delete_records
from aleph.index.entities import delete_entity, index_single

log = logging.getLogger(__name__)


def index_document(document, shallow=False, sync=False):
    log.info("Index document [%s]: %s", document.id, document.name)
    proxy = document.to_proxy()
    context = {
        'status': document.status,
        'content_hash': document.content_hash,
        'foreign_id': document.foreign_id,
        'error_message': document.error_message,
        'uploader_id': document.uploader_id,
        'title': document.title,
        'name': document.name,
        'summary': document.summary,
        'author': document.author,
        'generator': document.generator,
        'file_size': document.file_size,
        'file_name': document.file_name,
        'source_url': document.source_url,
        'languages': document.languages,
        'countries': document.countries,
        'keywords': document.keywords,
        'date': document.date,
        'authored_at': document.authored_at,
        'modified_at': document.modified_at,
        'published_at': document.published_at,
        'retrieved_at': document.retrieved_at,
        'dates': document.dates,
        'extension': document.extension,
        'encoding': document.encoding,
        'mime_type': document.mime_type,
        'pdf_version': document.pdf_version,
        'columns': document.columns,
        'ancestors': document.ancestors,
        'children': document.children.count()
    }
    texts = list(document.texts)
    texts.extend(document.columns)
    parent = document.parent
    if parent is not None:
        texts.append(parent.title)
        context['parent'] = {
            'id': parent.id,
            'schema': parent.schema,
            'title': parent.title,
        }
    if not shallow:
        index_records(document, sync=False)
    return index_single(document, proxy, context, texts, sync=sync)


def delete_document(document_id, sync=False):
    delete_records(document_id=document_id, sync=False)
    delete_entity(document_id, sync=sync)
