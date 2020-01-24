import logging
import warnings
from pkg_resources import get_distribution
from sqlalchemy.exc import SAWarning

from servicelayer.util import configure_logging

__version__ = get_distribution('aleph').version

from yaml import YAMLLoadWarning
warnings.filterwarnings('ignore', category=YAMLLoadWarning)

# shut up useless SA warning:
warnings.filterwarnings('ignore', 'Unicode type received non-unicode bind param value.')  # noqa
warnings.filterwarnings('ignore', category=SAWarning)

# logging
logging_level = configure_logging()

# specific loggers
logging.getLogger('faker').setLevel(logging_level)
logging.getLogger('flanker').setLevel(logging_level)
logging.getLogger('flanker.addresslib').setLevel(logging_level)
logging.getLogger('langid').setLevel(logging_level)
logging.getLogger('rdflib').setLevel(logging_level)
logging.getLogger('requests').setLevel(logging_level)
logging.getLogger('urllib3').setLevel(logging_level)
logging.getLogger('elasticsearch').setLevel(logging_level)
logging.getLogger('redis').setLevel(logging_level)
logging.getLogger('s3transfer').setLevel(logging_level)
logging.getLogger('amqp').setLevel(logging_level)
logging.getLogger('polyglot').setLevel(logging_level)
logging.getLogger('PIL').setLevel(logging_level)
logging.getLogger('neo4j').setLevel(logging_level)
logging.getLogger('pdfminer').setLevel(logging_level)
logging.getLogger('httpstream').setLevel(logging_level)
logging.getLogger('factory').setLevel(logging_level)
logging.getLogger('polyglot').setLevel(logging_level)
# logging.getLogger('sqlalchemy').setLevel(log_level)

# Log all SQL statements:
# logging.getLogger('sqlalchemy.engine').setLevel(log_level)
