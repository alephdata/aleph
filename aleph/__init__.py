import logging
import warnings
from pkg_resources import get_distribution
from sqlalchemy.exc import SAWarning

__version__ = get_distribution('aleph').version

# shut up useless SA warning:
warnings.filterwarnings('ignore', 'Unicode type received non-unicode bind param value.')  # noqa
warnings.filterwarnings('ignore', category=SAWarning)

# loggers.
logging.basicConfig(level=logging.DEBUG)

# specific loggers
logging.getLogger('flanker').setLevel(logging.WARNING)
logging.getLogger('flanker.addresslib').setLevel(logging.ERROR)
logging.getLogger('langid').setLevel(logging.WARNING)
logging.getLogger('rdflib').setLevel(logging.WARNING)
logging.getLogger('requests').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.ERROR)
logging.getLogger('pyelasticsearch').setLevel(logging.ERROR)
logging.getLogger('elasticsearch').setLevel(logging.INFO)
logging.getLogger('s3transfer').setLevel(logging.WARNING)
logging.getLogger('amqp').setLevel(logging.INFO)
logging.getLogger('polyglot').setLevel(logging.WARNING)
logging.getLogger('PIL').setLevel(logging.WARNING)
logging.getLogger('neo4j').setLevel(logging.WARNING)
logging.getLogger('pdfminer').setLevel(logging.WARNING)
logging.getLogger('httpstream').setLevel(logging.WARNING)
logging.getLogger('factory').setLevel(logging.WARNING)
logging.getLogger('polyglot').setLevel(logging.WARNING)
# logging.getLogger('sqlalchemy').setLevel(logging.INFO)

# Log all SQL statements:
# logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
