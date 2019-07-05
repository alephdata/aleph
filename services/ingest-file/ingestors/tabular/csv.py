import io
import csv
import logging
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.encoding import EncodingSupport
from ingestors.support.table import TableSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class CSVIngestor(Ingestor, EncodingSupport, TableSupport):
    """Decode and ingest a CSV file.

    This expects a properly formatted CSV file with a header in the first row.
    """
    MIME_TYPES = [
        'text/csv',
        'text/tsv',
        'text/tab-separated-values'
    ]
    EXTENSIONS = ['csv', 'tsv']
    SCORE = 7

    def ingest(self, file_path, entity):
        entity.schema = model.get('Table')
        with io.open(file_path, 'rb') as fh:
            encoding = self.detect_stream_encoding(fh)
            log.debug("Detected encoding [%r]: %s", entity, encoding)

        fh = io.open(file_path, 'r', encoding=encoding, errors='replace')
        try:
            sample = fh.read(4096 * 10)
            fh.seek(0)
            dialect = csv.Sniffer().sniff(sample)
            reader = csv.reader(fh, dialect=dialect)
            self.emit_row_tuples(entity, reader)
        except UnicodeDecodeError as ude:
            log.warning("Encoding error: %r", entity)
            raise ProcessingException("Could not decode CSV (%s)" % encoding) from ude  # noqa
        except Exception as err:
            log.exception("CSV error: %s", err)
            raise ProcessingException("Invalid CSV: %s" % err) from err
        finally:
            fh.close()
