import os

from textrecognizer.recognize import OCR

FIXTURES = '/service/tests/fixtures/'


class TestOCR(object):

    def test_ocr(self):
        ocr = OCR()
        with open(os.path.join(FIXTURES, 'mfsa.png'), 'rb') as fh:
            data = fh.read()
        text = ocr.extract_text(data, ['en'])
        assert 'THAMES RIVER TRADITIONAL' in text, text

    def test_ocr_russian(self):
        ocr = OCR()
        with open(os.path.join(FIXTURES, 'russian.png'), 'rb') as fh:
            data = fh.read()
        text = ocr.extract_text(data, ['ru'])
        assert 'которая извлечена из памяти' in text, text
