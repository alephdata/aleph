"""Aleph logic layer.

This package contains high-level business logic functions for
parts of aleph. This is stuff that would ordinarily live in
the model but that also depends on components (like ES search)
which in turn themselves depend on the model.
"""

from aleph.logic.entities import update_entity, update_entity_full  # noqa
from aleph.logic.entities import reindex_entities, delete_entity  # noqa
from aleph.logic.collections import update_collection, delete_collection  # noqa
from aleph.logic.collections import process_collection  # noqa
from aleph.logic.documents import update_document, delete_document  # noqa
from aleph.logic.alerts import check_alerts  # noqa
