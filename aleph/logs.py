import logging
import sys

import structlog
from structlog.contextvars import merge_contextvars, clear_contextvars, bind_contextvars

from aleph import __version__
from aleph import settings

LOG_FORMAT_TEXT = "TEXT"
LOG_FORMAT_JSON = "JSON"


def configure_logging():
    common_processors = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="%Y-%m-%d %H:%M:%S.%f"),
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]
    if settings.LOG_FORMAT == LOG_FORMAT_TEXT:
        processors = common_processors
        formatter = structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=processors, processor=structlog.dev.ConsoleRenderer(),
        )
    else:
        processors = common_processors + [
            merge_contextvars,
            format_stackdriver,
        ]
        formatter = structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=processors, processor=structlog.processors.JSONRenderer(),
        )

    # configuration for structlog based loggers
    structlog.configure(
        processors=processors
        + [structlog.stdlib.ProcessorFormatter.wrap_for_formatter,],
        logger_factory=structlog.stdlib.LoggerFactory(),
    )

    # handler for low level logs that should be sent to STDOUT
    info_handler = logging.StreamHandler(sys.stdout)
    info_handler.setLevel(logging.INFO)
    info_handler.addFilter(_MaxLevelFilter(logging.WARNING))
    info_handler.setFormatter(formatter)
    # handler for high level logs that should be sent to STDERR
    error_handler = logging.StreamHandler(sys.stderr)
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    # check to prevent adding duplicate handlers
    if not root_logger.handlers:
        root_logger.addHandler(info_handler)
        root_logger.addHandler(error_handler)


def format_stackdriver(_, __, ed):
    """Stackdriver uses `message` and `severity` keys to display logs"""
    ed["message"] = ed.pop("event")
    ed["severity"] = ed.pop("level", "info").upper()
    return ed


class _MaxLevelFilter(object):
    def __init__(self, highest_log_level):
        self._highest_log_level = highest_log_level

    def filter(self, log_record):
        return log_record.levelno <= self._highest_log_level
