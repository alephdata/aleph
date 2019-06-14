import logging
from io import BytesIO
from datetime import datetime
from PIL import Image, ExifTags
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.ocr import OCRSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class ImageIngestor(Ingestor, OCRSupport):
    """Image file ingestor class. Extracts the text from images using OCR."""

    MIME_TYPES = [
        'image/x-portable-graymap',
        'image/png',
        'image/x-png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/pjpeg',
        'image/bmp',
        'image/x-windows-bmp',
        'image/x-portable-bitmap',
        'image/x-coreldraw',
        'application/postscript',
        'image/vnd.dxf',
    ]
    EXTENSIONS = [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'bmp'
    ]
    SCORE = 10

    def parse_exif_date(self, date):
        try:
            return datetime.strptime(date, '%Y:%m:%d %H:%M:%S')
        except Exception:
            return None

    def extract_exif(self, img, entity):
        if not hasattr(img, '_getexif'):
            return

        exif = img._getexif()
        if exif is None:
            return

        for num, value in exif.items():
            try:
                tag = ExifTags.TAGS[num]
            except KeyError:
                log.warning("Unknown EXIF code: %s", num)
                continue
            if tag == 'DateTimeOriginal':
                entity.add('authoredAt', self.parse_exif_date(value))
            if tag == 'DateTime':
                entity.add('date', self.parse_exif_date(value))
            if tag == 'Make':
                entity.add('generator', value)
            if tag == 'Model':
                entity.add('generator', value)

    def ingest(self, file_path, entity):
        entity.schema = model.get('Image')
        with open(file_path, 'rb') as fh:
            data = fh.read()

        try:
            image = Image.open(BytesIO(data))
            image.load()
            self.extract_exif(image, entity)

            languages = self.manager.context.get('languages')
            text = self.extract_ocr_text(data, languages=languages)
            entity.add('bodyText', text)
        except Exception as err:
            raise ProcessingException("Failed to load image: %r" % err)

    @classmethod
    def match(cls, file_path, entity):
        score = super(ImageIngestor, cls).match(file_path, entity)
        if score <= 0:
            for mime_type in entity.get('mimeType'):
                if mime_type.startswith('image/'):
                    score = cls.SCORE - 1
        return score
