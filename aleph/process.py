import sys
import traceback

from aleph.model import ProcessingLog
from aleph.model.log import CRAWL, INGEST, ANALYZE, INDEX


def log(operation, component=None, source_location=None, content_hash=None,
        foreign_id=None, source_id=None, document_id=None, meta=None,
        error_type=None, error_message=None, error_details=None):
    """Record an event taking place during document processing."""
    assert operation in (CRAWL, INGEST, ANALYZE, INDEX)
    if hasattr(meta, 'to_dict'):
        meta = meta.to_dict()
    ProcessingLog.log(operation, component=component,
                      source_location=source_location,
                      content_hash=content_hash, foreign_id=foreign_id,
                      source_id=source_id, document_id=document_id, meta=meta,
                      error_type=error_type, error_message=error_message,
                      error_details=error_details)


def exception(operation, exception, component=None, source_location=None,
              content_hash=None, foreign_id=None, source_id=None,
              document_id=None, meta=None):
    """Record an exception thrown during document processing."""
    (error_type, error_message, error_details) = sys.exc_info()
    if error_type is not None:
        error_type = error_type.__name__
        error_message = unicode(error_message)
        error_details = traceback.format_exc()
    log(operation, component=component, source_location=source_location,
        content_hash=content_hash, foreign_id=foreign_id, source_id=source_id,
        document_id=document_id, meta=meta, error_type=error_type,
        error_message=error_message, error_details=error_details)
