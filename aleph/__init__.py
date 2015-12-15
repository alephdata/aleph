import logging

# shut up useless SA warning:
import warnings
warnings.filterwarnings('ignore',
                        'Unicode type received non-unicode bind param value.')
from sqlalchemy.exc import SAWarning
warnings.filterwarnings('ignore', category=SAWarning)

# loggers.
logging.basicConfig(level=logging.DEBUG)

# specific loggers
logging.getLogger('requests').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)
logging.getLogger('pyelasticsearch').setLevel(logging.WARNING)
logging.getLogger('elasticsearch').setLevel(logging.WARNING)
logging.getLogger('docpipe').setLevel(logging.INFO)
logging.getLogger('boto').setLevel(logging.INFO)
logging.getLogger('amqp').setLevel(logging.INFO)
