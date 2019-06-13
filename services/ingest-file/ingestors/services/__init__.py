from servicelayer import settings

from ingestors.services.ocr import ServiceOCRService
from ingestors.services.ocr import GoogleOCRService


def get_ocr():
    """Find the best available method to perform OCR."""
    if not hasattr(settings, '_ingestors_ocr'):
        if GoogleOCRService.is_available():
            settings._ingestors_ocr = GoogleOCRService()
        elif ServiceOCRService.is_available():
            settings._ingestors_ocr = ServiceOCRService()
        else:
            raise RuntimeError("OCR is not available")
    return settings._ingestors_ocr
