import io
import csv
import logging
from collections import OrderedDict
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.encoding import EncodingSupport
from ingestors.support.table import TableSupport
from ingestors.exc import ProcessingException
from ingestors.util import safe_string

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

    def generate_rows(self, reader, has_header=False):
        headers = next(reader) if has_header else []
        headers = [safe_string(h) for h in headers]
        for row in reader:
            while len(headers) < len(row):
                next_col = len(headers) + 1
                headers.append('Column %s' % next_col)
            data = OrderedDict()
            for header, value in zip(headers, row):
                data[header] = safe_string(value)
            yield data

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
            # dialect.delimiter = dialect.delimiter[0]
            has_header = csv.Sniffer().has_header(sample)

            reader = csv.reader(fh, dialect=dialect)
            rows = self.generate_rows(reader, has_header=has_header)
            self.emit_row_dicts(entity, rows)
        except UnicodeDecodeError:
            log.warning("Encoding error: %r", entity)
            raise ProcessingException("Could not decode CSV (%s)" % encoding)
        except Exception as err:
            log.exception("CSV error: %s", err)
            raise ProcessingException("Invalid CSV: %s" % err)
        finally:
            fh.close()
