import time
import logging
from sqlalchemy.exc import DBAPIError

from aleph.core import db, get_dataset
from aleph.model import Document, DocumentRecord
from aleph.index.entities import index_bulk

log = logging.getLogger(__name__)


def index_collection_from_staging(collection):
    dataset = get_dataset(collection)
    # TODO: run NLP here
    index_bulk(collection.id, dataset.iterate(), merge=False)


def _export_balkhash_collection(collection, retries=0, backoff=30, offset=0):
    MAX_RETRIES = 5
    RETRY_BACKOFF_FACTOR = 2
    try:
        from followthemoney import model
        dataset = get_dataset(collection)
        writer = dataset.bulk()
        q = Document.by_collection(collection.id)
        q = q.order_by(Document.id.asc()).offset(offset)
        for doc in q.yield_per(5000):
            log.debug("Export [%s:%s]: %s", doc.id, doc.schema, doc.name)
            dproxy = doc.to_proxy()
            writer.put(dproxy)
            if doc.supports_records:
                q = db.session.query(DocumentRecord)
                q = q.filter(DocumentRecord.document_id == doc.id)
                for record in q.yield_per(100):
                    rproxy = record.to_proxy()
                    writer.put(rproxy)
                    dpart = model.make_entity(doc.schema)
                    dpart.id = dproxy.id
                    dpart.add('indexText', list(record.texts))
                    writer.put(dpart, fragment=str(record.id))
            offset += 1
        dataset.close()
    except DBAPIError as exc:
        if retries < MAX_RETRIES:
            log.debug("Error occurred: %s", exc)
            log.debug("Retrying in %s seconds", backoff)
            db.session.close()
            dataset.close()
            time.sleep(backoff)
            retries = retries + 1
            backoff = backoff * RETRY_BACKOFF_FACTOR
            return _export_balkhash_collection(
                collection, retries, backoff, offset
            )
        else:
            log.exception(exc)
