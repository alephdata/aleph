import logging
from datetime import datetime, date
from banal import ensure_list

from ingestors.util import safe_string

log = logging.getLogger(__name__)


class TimestampSupport(object):
    """Provides helpers for date and time parsing."""
    TIMESTAMP_FORMATS = (
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M:%SZ',
        '%Y:%m:%d %H:%M:%SZ',  # exif
        '%Z %Y-%m-%d %H:%M:%S',
        '%Y-%m-%d',
        '%Y%m%d',
    )

    def parse_timestamp(self, raw, fmt=None):
        if isinstance(raw, (datetime, date)):
            return raw
        text = safe_string(raw)
        if text is None:
            return
        formats = ensure_list(fmt) or self.TIMESTAMP_FORMATS
        for fmt in formats:
            try:
                return datetime.strptime(text, fmt)
            except Exception:
                pass
        log.debug("Could not parse timestamp: %r", raw)
        return raw
