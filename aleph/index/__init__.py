from aleph.index.admin import init_search, upgrade_search  # noqa
from aleph.index.admin import delete_index, flush_index  # noqa
from aleph.index.entities import index_entity, delete_entity  # noqa
from aleph.index.documents import index_document, index_document_id  # noqa
from aleph.index.documents import delete_document  # noqa
from aleph.index.records import index_records  # noqa
from aleph.index.datasets import index_items, delete_dataset  # noqa
from aleph.index.leads import index_lead, delete_entity_leads  # noqa
from aleph.index.mapping import TYPE_DOCUMENT, DOCUMENT_MAPPING  # noqa
from aleph.index.mapping import TYPE_RECORD, RECORD_MAPPING  # noqa
from aleph.index.mapping import TYPE_ENTITY, ENTITY_MAPPING  # noqa
from aleph.index.mapping import TYPE_COLLECTION, COLLECTION_MAPPING  # noqa
from aleph.index.mapping import TYPE_LEAD, LEAD_MAPPING  # noqa
from aleph.index.mapping import TYPE_LINK, LINK_MAPPING  # noqa
from aleph.index.mapping import(  # noqa
    ENTITY_MAPPING, LINK_MAPPING, LEAD_MAPPING)
