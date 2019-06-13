from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.pdf import PDFSupport
from ingestors.support.temp import TempFileSupport


class DjVuIngestor(Ingestor, PDFSupport, TempFileSupport):
    """Read DejaVu E-Books."""
    MIME_TYPES = [
        'image/vnd.djvu',
        'image/x.djvu',
        'image/x-djvu',
        'image/djvu',
    ]  # noqa

    def ingest(self, file_path, entity):
        """Ingestor implementation."""
        entity.schema = model.get('Pages')
        pdf_path = self.make_work_file('page.pdf')
        self.exec_command('ddjvu',
                          '-format=pdf',
                          '-quality=100',
                          '-skip',
                          file_path,
                          pdf_path)
        self.assert_outfile(pdf_path)
        self.pdf_alternative_extract(entity, pdf_path)
