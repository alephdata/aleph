import logging
import warnings
from sqlalchemy.exc import SAWarning
from pkg_resources import get_distribution

__version__ = get_distribution("aleph").version

# shut up useless SA warning:
warnings.filterwarnings(
    "ignore", "Unicode type received non-unicode bind param value."
)  # noqa
warnings.filterwarnings("ignore", category=SAWarning)

# specific loggers
logging.getLogger("faker").setLevel(logging.WARNING)
logging.getLogger("rdflib").setLevel(logging.WARNING)
logging.getLogger("requests").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.ERROR)
logging.getLogger("elasticsearch").setLevel(logging.ERROR)
logging.getLogger("redis").setLevel(logging.DEBUG)
logging.getLogger("s3transfer").setLevel(logging.WARNING)
logging.getLogger("PIL").setLevel(logging.WARNING)
logging.getLogger("pdfminer").setLevel(logging.WARNING)
logging.getLogger("httpstream").setLevel(logging.WARNING)
logging.getLogger("factory").setLevel(logging.WARNING)
logging.getLogger("pika").setLevel(logging.WARNING)

# Log all SQL statements:
# logging.getLogger('sqlalchemy.engine').setLevel(log_level)
