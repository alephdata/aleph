import uuid
from pdflib import Document
from followthemoney import model
from normality import collapse_spaces  # noqa

from ingestors.support.ocr import OCRSupport
from ingestors.support.convert import DocumentConvertSupport


class PDFSupport(DocumentConvertSupport, OCRSupport):
    """Provides helpers for PDF file context extraction."""

    def pdf_extract(self, entity, pdf):
        """Extract pages and page text from a PDF file."""
        entity.schema = model.get("Pages")
        temp_dir = self.make_empty_directory()
        for page in pdf:
            self.pdf_extract_page(entity, temp_dir, page)

    def pdf_alternative_extract(self, entity, pdf_path):
        checksum = self.manager.store(pdf_path)
        entity.set("pdfHash", checksum)
        pdf = Document(bytes(pdf_path))
        self.pdf_extract(entity, pdf)

    def pdf_extract_page(self, document, temp_dir, page):
        """Extract the contents of a single PDF page, using OCR if need be."""
        texts = page.lines
        image_path = temp_dir.joinpath(str(uuid.uuid4()))
        page.extract_images(path=bytes(image_path), prefix=b"img")
        languages = self.manager.context.get("languages")
        for image_file in image_path.glob("*.png"):
            with open(image_file, "rb") as fh:
                data = fh.read()
                text = self.extract_ocr_text(data, languages=languages)
                if text is not None:
                    texts.append(text)

        text = " \n".join(texts).strip()

        entity = self.manager.make_entity("Page")
        entity.make_id(document.id, page.page_no)
        entity.set("document", document)
        entity.set("index", page.page_no)
        entity.add("bodyText", text)
        self.manager.apply_context(entity, document)
        self.manager.emit_entity(entity)
        self.manager.emit_text_fragment(document, text, entity.id)
