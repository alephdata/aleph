import logging
import warnings
from flask.exthook import ExtDeprecationWarning
from sqlalchemy.exc import SAWarning

# shut up useless SA warning:
warnings.filterwarnings('ignore',
                        'Unicode type received non-unicode bind param value.')

warnings.filterwarnings('ignore', category=SAWarning)
warnings.filterwarnings('ignore', category=ExtDeprecationWarning)

# loggers.
logging.basicConfig(level=logging.DEBUG)

# specific loggers
logging.getLogger('requests').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)
logging.getLogger('pyelasticsearch').setLevel(logging.WARNING)
logging.getLogger('elasticsearch').setLevel(logging.WARNING)
logging.getLogger('s3transfer').setLevel(logging.WARNING)
logging.getLogger('amqp').setLevel(logging.INFO)
logging.getLogger('polyglot').setLevel(logging.WARNING)
logging.getLogger('PIL').setLevel(logging.WARNING)
logging.getLogger('neo4j').setLevel(logging.WARNING)
logging.getLogger('pdfminer').setLevel(logging.WARNING)
logging.getLogger('httpstream').setLevel(logging.WARNING)
logging.getLogger('factory').setLevel(logging.WARNING)

# Log all SQL statements:
# logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
