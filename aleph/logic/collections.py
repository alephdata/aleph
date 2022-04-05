import base64
import logging
import json
from tempfile import NamedTemporaryFile
from datetime import datetime
from collections import Counter, defaultdict
from servicelayer.jobs import Job

from aleph.core import archive, db, cache
from aleph.authz import Authz
from aleph.queues import cancel_queue, ingest_entity, get_status
from aleph.model import Collection, Entity, Document, Mapping
from aleph.model import Permission, Events, EntitySet
from aleph.index import collections as index
from aleph.index import xref as xref_index
from aleph.index import entities as entities_index
from aleph.logic.notifications import publish, flush_notifications
from aleph.logic.documents import ingest_flush, MODEL_ORIGIN
from aleph.logic.aggregator import get_aggregator
from aleph.util import JSONEncoder

log = logging.getLogger(__name__)


def create_collection(data, authz, sync=False):
    now = datetime.utcnow()
    collection = Collection.create(data, authz, created_at=now)
    if collection.created_at == now:
        publish(
            Events.CREATE_COLLECTION,
            params={"collection": collection},
            channels=[collection, authz.role],
            actor_id=authz.id,
        )
    db.session.commit()
    return update_collection(collection, sync=sync)


def update_collection(collection, sync=False):
    """Update a collection and re-index."""
    Authz.flush()
    refresh_collection(collection.id)
    return index.index_collection(collection, sync=sync)


def refresh_collection(collection_id):
    """Operations to execute after updating a collection-related
    domain object. This will refresh stats and flush cache."""
    cache.kv.delete(
        cache.object_key(Collection, collection_id),
        cache.object_key(Collection, collection_id, "stats"),
    )


def get_deep_collection(collection):
    mappings = Mapping.by_collection(collection.id).count()
    entitysets = EntitySet.type_counts(collection_id=collection.id)
    return {
        "statistics": index.get_collection_stats(collection.id),
        "counts": {"mappings": mappings, "entitysets": entitysets},
        "status": get_status(collection),
        "shallow": False,
    }


def compute_collections():
    """Update collection caches, including the global stats cache."""
    authz = Authz.from_role(None)
    schemata = defaultdict(int)
    countries = defaultdict(int)
    categories = defaultdict(int)

    for collection in Collection.all():
        compute_collection(collection)

        if authz.can(collection.id, authz.READ):
            categories[collection.category] += 1
            things = index.get_collection_things(collection.id)
            for schema, count in things.items():
                schemata[schema] += count
            for country in collection.countries:
                countries[country] += 1

    log.info("Updating global statistics cache...")
    data = {
        "collections": sum(categories.values()),
        "schemata": dict(schemata),
        "countries": dict(countries),
        "categories": dict(categories),
        "things": sum(schemata.values()),
    }
    key = cache.key(cache.STATISTICS)
    cache.set_complex(key, data, expires=cache.EXPIRE)


def compute_collection(collection, force=False, sync=False):
    key = cache.object_key(Collection, collection.id, "stats")
    if cache.get(key) is not None and not force:
        return
    refresh_collection(collection.id)
    log.info("[%s] Computing statistics...", collection)
    index.update_collection_stats(collection.id)
    cache.set(key, datetime.utcnow().isoformat())
    index.index_collection(collection, sync=sync)


def aggregate_model(collection, aggregator):
    """Sync up the aggregator from the Aleph domain model."""
    log.debug("[%s] Aggregating model...", collection)
    aggregator.delete(origin=MODEL_ORIGIN)
    writer = aggregator.bulk()
    for document in Document.by_collection(collection.id):
        proxy = document.to_proxy(ns=collection.ns)
        writer.put(proxy, fragment="db", origin=MODEL_ORIGIN)
    for entity in Entity.by_collection(collection.id):
        proxy = entity.to_proxy()
        aggregator.delete(entity_id=proxy.id)
        writer.put(proxy, fragment="db", origin=MODEL_ORIGIN)
    writer.flush()


def index_aggregator(
    collection, aggregator, entity_ids=None, skip_errors=False, sync=False
):
    def _generate():
        idx = 0
        entities = aggregator.iterate(entity_id=entity_ids, skip_errors=skip_errors)
        for idx, proxy in enumerate(entities, 1):
            if idx > 0 and idx % 1000 == 0:
                log.debug("[%s] Index: %s...", collection, idx)
            yield proxy
        log.debug("[%s] Indexed %s entities", collection, idx)

    entities_index.index_bulk(collection, _generate(), sync=sync)


def reingest_collection(collection, job_id=None, index=False, flush=True):
    """Trigger a re-ingest for all documents in the collection."""
    job_id = job_id or Job.random_id()
    if flush:
        ingest_flush(collection)
    for document in Document.by_collection(collection.id):
        proxy = document.to_proxy(ns=collection.ns)
        ingest_entity(collection, proxy, job_id=job_id, index=index)


def reindex_collection(collection, skip_errors=True, sync=False, flush=False):
    """Re-index all entities from the model, mappings and aggregator cache."""
    from aleph.logic.mapping import map_to_aggregator
    from aleph.logic.profiles import profile_fragments

    aggregator = get_aggregator(collection)
    for mapping in collection.mappings:
        if mapping.disabled:
            log.debug("[%s] Skip mapping: %r", collection, mapping)
            continue
        try:
            map_to_aggregator(collection, mapping, aggregator)
        except Exception:
            # More or less ignore broken models.
            log.exception("Failed mapping: %r", mapping)
    aggregate_model(collection, aggregator)
    profile_fragments(collection, aggregator)
    if flush:
        log.debug("[%s] Flushing...", collection)
        index.delete_entities(collection.id, sync=True)
    index_aggregator(collection, aggregator, skip_errors=skip_errors, sync=sync)
    compute_collection(collection, force=True)


def delete_collection(collection, keep_metadata=False, sync=False):
    deleted_at = collection.deleted_at or datetime.utcnow()
    cancel_queue(collection)
    aggregator = get_aggregator(collection)
    aggregator.delete()
    flush_notifications(collection, sync=sync)
    index.delete_entities(collection.id, sync=sync)
    xref_index.delete_xref(collection, sync=sync)
    Mapping.delete_by_collection(collection.id)
    EntitySet.delete_by_collection(collection.id, deleted_at)
    Entity.delete_by_collection(collection.id)
    Document.delete_by_collection(collection.id)
    if not keep_metadata:
        Permission.delete_by_collection(collection.id)
        collection.delete(deleted_at=deleted_at)
    db.session.commit()
    if not keep_metadata:
        index.delete_collection(collection.id, sync=True)
        aggregator.drop()
    refresh_collection(collection.id)
    Authz.flush()


def upgrade_collections():
    for collection in Collection.all(deleted=True):
        if collection.deleted_at is not None:
            delete_collection(collection, keep_metadata=True, sync=True)
        else:
            compute_collection(collection, force=True)
    # update global cache:
    compute_collections()


def export_collection(collection, start_date=None, end_date=None):
    PREFIXES = {
        "Collection": "C@",
        "Mapping": "M@",
        "EntitySet": "S@",
    }

    def _dump_file(content_hash):
        buffer = archive.load_file(content_hash)
        with open(buffer, "rb") as f:
            content = f.read()
        return base64.b64encode(content).decode()

    encoder = JSONEncoder(sort_keys=True)
    res = Counter()

    # log.info("[%s] Exporting collection metadata...", collection)
    yield PREFIXES["Collection"] + encoder.encode(collection)

    # log.info("[%s] Exporting mappings metadata...", collection)
    for mapping in Mapping.by_collection(collection.id):
        yield PREFIXES["Mapping"] + encoder.encode(mapping)
        res["Mappings"] += 1

    # log.info("[%s] Exporting documents...", collection)
    for document in Document.by_collection(collection.id):
        blob = _dump_file(document.content_hash)
        meta = encoder.encode(document.to_proxy())
        yield f"@{meta}@{blob}"
        res["Documents"] += 1

    # log.info("[%s] Exporting ftm entities...", collection)
    for entity in Entity.by_collection(collection.id):
        yield encoder.encode(entity.to_proxy())
        res["Entities"] += 1

    # log.info("[%s] Exporting entitysets metadata...", collection)
    for entityset in EntitySet.by_collection_id(collection.id):
        data = entityset.to_dict()
        data["entities"] = entityset.entities
        yield PREFIXES["EntitySet"] + encoder.encode(data)
        res["EntitySets"] += 1

    return res


def import_collection(collection, infile, authz):
    from aleph.logic.processing import bulk_write  # FIXME

    res = Counter()
    job_id = Job.random_id()

    class BulkWriter(object):
        data = []

        def add(self, data):
            if len(self.data) == 10000:
                self.flush()
            self.data.append(data)

        def flush(self):
            if self.data:
                for _ in bulk_write(collection, self.data, safe=True):
                    pass
                self.data = []

    writer = BulkWriter()

    def _import_file(b64string):
        with NamedTemporaryFile() as f:
            content = base64.b64decode(b64string.encode())
            f.write(content)
            return archive.archive_file(f.name)

    for line in infile.readlines():
        if line.startswith("C@"):
            data = json.loads(line[2:])
            collection.update(data, authz)
        elif line.startswith("@"):
            data, content = line[1:].split("@", 1)
            data = json.loads(data)
            content_hash = _import_file(content)
            meta = {"file_name": data["properties"].get("fileName", [None])[0]}
            document = Document.save(
                collection,
                content_hash=content_hash,
                meta=meta,
            )
            db.session.commit()
            proxy = document.to_proxy()
            ingest_flush(collection, entity_id=proxy.id)
            ingest_entity(collection, proxy, job_id=job_id)
            res["Documents"] += 1
        elif line.startswith("M@"):
            pass
        elif line.startswith("S@"):
            pass
        elif line.startswith("{"):
            writer.add(json.loads(line))

    writer.flush()
    reindex_collection(collection)

    return res
