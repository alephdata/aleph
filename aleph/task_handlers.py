from aleph.logic.processing import index_many
from aleph.logic.xref import xref_collection, export_matches
from aleph.logic.collections import reingest_collection, reindex_collection
from aleph.logic.entities import update_entity, prune_entity
from aleph.logic.mapping import load_mapping, flush_mapping
from aleph.logic.export import export_entities


def op_index_handler(collection, task):
    sync = task.context.get("sync", False)
    index_many(task.stage, collection, sync=sync, **task.payload)


def op_xref_handler(collection, task):
    xref_collection(collection)


def op_reingest_handler(collection, task):
    reingest_collection(collection, job_id=task.stage.job.id, **task.payload)


def op_reindex_handler(collection, task):
    sync = task.context.get("sync", False)
    reindex_collection(collection, sync=sync, **task.payload)


def op_load_mapping_handler(collection, task):
    load_mapping(collection, **task.payload)


def op_flush_mapping_handler(collection, task):
    sync = task.context.get("sync", False)
    flush_mapping(collection, sync=sync, **task.payload)


def op_update_entity_handler(collection, task):
    update_entity(collection, job_id=task.stage.job.id, **task.payload)


def op_prune_entity_handler(collection, task):
    prune_entity(collection, job_id=task.stage.job.id, **task.payload)


def op_export_search_results_handler(_, task):
    export_entities(**task.payload)


def op_export_xref_results_handler(_, task):
    export_matches(**task.payload)
