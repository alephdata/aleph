import logging
from itertools import islice
from datetime import datetime
from elasticsearch.helpers import scan

from aleph.core import db, es, celery
from aleph.authz import Authz
from aleph.model import Collection, Document, Entity, Match
from aleph.model import Role, Permission, Events
from aleph.index import collections as index
from aleph.index.core import entities_index
from aleph.index.util import authz_query
from aleph.logic.notifications import publish, flush_notifications
from aleph.logic.util import document_url, entity_url

log = logging.getLogger(__name__)


def create_collection(data, role=None):
    role = role or Role.load_cli_user()
    created_at = datetime.utcnow()
    collection = Collection.create(data, role=role, created_at=created_at)
    if collection.created_at == created_at:
        publish(Events.CREATE_COLLECTION,
                actor_id=role.id,
                params={'collection': collection})
    db.session.commit()
    index.index_collection(collection)
    return collection


def update_collection(collection):
    """Create or update a collection."""
    index_collection_async.delay(collection.id)
    # from aleph.logic.xref import xref_collection
    # if collection.casefile and collection.deleted_at is None:
    #     xref_collection.apply_async([collection.id], priority=2)


@celery.task(priority=7)
def index_collection_async(collection_id):
    collection = Collection.by_id(collection_id, deleted=True)
    if collection is not None:
        log.info("Index [%s]: %s", collection.id, collection.label)
        index.index_collection(collection)


def update_collections():
    cq = db.session.query(Collection)
    cq = cq.order_by(Collection.id.desc())
    for collection in cq.all():
        update_collection(collection)


@celery.task(priority=8)
def update_collection_access(collection_id):
    """Re-write all etities in this collection to reflect updated roles."""
    collection = Collection.by_id(collection_id, deleted=True)
    if collection is None:
        return
    log.info("Update roles [%s]: %s", collection.foreign_id, collection.label)
    index.update_collection_roles(collection)


def generate_sitemap(collection_id):
    """Generate entries for a collection-based sitemap.xml file."""
    # cf. https://www.sitemaps.org/protocol.html
    query = {
        'query': {
            'bool': {
                'filter': [
                    {'term': {'collection_id': collection_id}},
                    {'term': {'schemata': Entity.THING}},
                    authz_query(Authz.from_role(None))
                ]
            }
        },
        '_source': {'includes': ['schemata', 'updated_at']}
    }
    scanner = scan(es, index=entities_index(), query=query)
    # strictly, the limit for sitemap.xml is 50,000
    for res in islice(scanner, 49500):
        source = res.get('_source', {})
        updated_at = source.get('updated_at', '').split('T', 1)[0]
        if Document.SCHEMA in source.get('schemata', []):
            url = document_url(res.get('_id'))
        else:
            url = entity_url(res.get('_id'))
        yield (url, updated_at)


def delete_collection(collection):
    flush_notifications(collection)
    collection.delete()
    db.session.commit()
    index.delete_collection(collection.id)
    delete_collection_content.apply_async([collection.id], priority=7)


@celery.task()
def delete_collection_content(collection_id):
    # Deleting a collection affects many associated objects and requires
    # checks, so this is done manually and in detail here.
    q = db.session.query(Collection)
    q = q.filter(Collection.id == collection_id)
    collection = q.first()
    if collection is None:
        log.error("No collection with ID: %r", collection_id)
        return

    log.info("Deleting collection [%r]: %r", collection.id, collection.label)
    deleted_at = collection.deleted_at or datetime.utcnow()
    index.delete_collection(collection_id)

    delete_documents(collection_id, deleted_at=deleted_at)
    delete_entities(collection_id, deleted_at=deleted_at)

    log.info("Deleting permissions...")
    Permission.delete_by_collection(collection_id, deleted_at=deleted_at)

    collection.delete(deleted_at=deleted_at)
    db.session.commit()


def delete_entities(collection_id, deleted_at=None):
    deleted_at = deleted_at or datetime.utcnow()
    log.info("Deleting entities...")
    Entity.delete_by_collection(collection_id, deleted_at=deleted_at)
    index.delete_entities(collection_id)
    log.info("Deleting cross-referencing matches...")
    Match.delete_by_collection(collection_id, deleted_at=deleted_at)


def delete_documents(collection_id, deleted_at=None):
    deleted_at = deleted_at or datetime.utcnow()
    log.info("Deleting documents...")
    Document.delete_by_collection(collection_id, deleted_at=deleted_at)
    index.delete_documents(collection_id)
    log.info("Deleting cross-referencing matches...")
    Match.delete_by_collection(collection_id, deleted_at=deleted_at)
