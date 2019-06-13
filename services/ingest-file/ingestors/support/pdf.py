import uuid
import pathlib

from followthemoney import model
from normality import collapse_spaces  # noqa
from pdflib import Document
from normality import stringify

from ingestors.services import get_ocr, get_convert
from ingestors.support.temp import TempFileSupport
from ingestors.services.util import ShellCommand
from ingestors.exc import ProcessingException


class PDFSupport(TempFileSupport, ShellCommand):
    """Provides helpers for PDF file context extraction."""

    def pdf_extract(self, entity, pdf):
        """Extract pages and page text from a PDF file."""
        entity.schema = model.get('Pages')
        temp_dir = self.make_empty_directory()
        for page in pdf:
            self.pdf_extract_page(entity, temp_dir, page)

    def pdf_alternative_extract(self, entity, pdf_path):
        checksum = self.manager.archive.archive_file(pdf_path)
        entity.set('pdfHash', checksum)
        pdf = Document(bytes(pdf_path))
        self.pdf_extract(entity, pdf)

    def document_to_pdf(self, file_path, entity):
        """Convert an office document into a PDF file."""
        converter = get_convert()
        pdf_path = converter.document_to_pdf(file_path,
                                             entity,
                                             self.manager.work_path,
                                             self.manager.archive)
        if pdf_path is not None:
            return pathlib.Path(pdf_path)
        raise ProcessingException("Failed to convert to PDF.")

    def pdf_extract_page(self, document, temp_dir, page):
        """Extract the contents of a single PDF page, using OCR if need be."""
        texts = page.lines
        image_path = temp_dir.joinpath(str(uuid.uuid4()))
        page.extract_images(path=bytes(image_path), prefix=b'img')
        ocr = get_ocr()
        languages = self.manager.context.get('languages')
        for image_file in image_path.glob("*.png"):
            with open(image_file, 'rb') as fh:
                data = fh.read()
                text = ocr.extract_text(data, languages=languages)
                text = stringify(text)
                # text = collapse_spaces(text)
                if text is not None:
                    texts.append(text)

        text = ' \n'.join(texts).strip()

        entity = self.manager.make_entity('Page')
        entity.make_id(document.id, page.page_no)
        entity.set('document', document)
        entity.set('index', page.page_no)
        entity.add('bodyText', text)
        self.manager.emit_entity(entity)
        self.manager.emit_text_fragment(document, text, entity.id)
