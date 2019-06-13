from servicelayer import settings

from ingestors.services.ocr import LocalOCRService
from ingestors.services.ocr import ServiceOCRService
from ingestors.services.ocr import GoogleOCRService
from ingestors.services.convert import LocalDocumentConverter
from ingestors.services.convert import ServiceDocumentConverter


def get_ocr():
    """Find the best available method to perform OCR."""
    if not hasattr(settings, '_ingestors_ocr'):
        if GoogleOCRService.is_available():
            settings._ingestors_ocr = GoogleOCRService()
        elif ServiceOCRService.is_available():
            settings._ingestors_ocr = ServiceOCRService()
        elif LocalOCRService.is_available():
            settings._ingestors_ocr = LocalOCRService()
        else:
            raise RuntimeError("OCR is not available")
    return settings._ingestors_ocr


def get_convert():
    """Find the best available method to convert documents to the
    PDF format."""
    if not hasattr(settings, '_ingestors_convert'):
        if ServiceDocumentConverter.is_available():
            settings._ingestors_convert = ServiceDocumentConverter()
        elif LocalDocumentConverter.is_available():
            settings._ingestors_convert = LocalDocumentConverter()
        else:
            raise RuntimeError("Document conversion is not available")
    return settings._ingestors_convert
