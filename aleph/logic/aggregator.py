import time
import logging
import balkhash
from sqlalchemy.exc import DBAPIError
from followthemoney import model

from aleph.core import db
from aleph.model import Document, DocumentRecord

log = logging.getLogger(__name__)


def get_aggregator(collection):
    """Connect to a balkhash dataset."""
    return balkhash.init(collection.foreign_id)


def drop_aggregator(collection):
    """Clear all the documents from the balkhash dataset."""
    aggregator = get_aggregator(collection)
    aggregator.delete()
    aggregator.close()


def export_balkhash_collection(collection, retries=0, backoff=30, offset=0):
    MAX_RETRIES = 5
    RETRY_BACKOFF_FACTOR = 2
    try:
        aggregator = get_aggregator(collection)
        writer = aggregator.bulk()
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
        aggregator.close()
    except DBAPIError as exc:
        if retries < MAX_RETRIES:
            log.debug("Error occurred: %s", exc)
            log.debug("Retrying in %s seconds", backoff)
            db.session.close()
            aggregator.close()
            time.sleep(backoff)
            retries = retries + 1
            backoff = backoff * RETRY_BACKOFF_FACTOR
            return export_balkhash_collection(
                collection, retries, backoff, offset
            )
        else:
            log.exception(exc)
