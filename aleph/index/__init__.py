from aleph.index.admin import init_search, upgrade_search  # noqa
from aleph.index.admin import delete_index, flush_index  # noqa
from aleph.index.entities import index_entity, delete_entity  # noqa
from aleph.index.documents import index_document, index_document_id  # noqa
from aleph.index.documents import delete_document  # noqa
from aleph.index.records import index_records  # noqa
from aleph.index.datasets import index_items, delete_dataset  # noqa
from aleph.index.leads import index_lead, delete_entity_leads  # noqa
from aleph.index.mapping import TYPE_DOCUMENT, TYPE_RECORD, TYPE_ENTITY  # noqa
from aleph.index.mapping import TYPE_LINK, TYPE_LEAD  # noqa
from aleph.index.mapping import DOCUMENT_MAPPING, RECORD_MAPPING  # noqa
from aleph.index.mapping import(  # noqa
    ENTITY_MAPPING, LINK_MAPPING, LEAD_MAPPING)
