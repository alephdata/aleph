import io
from ingestors import PDFIngestor, DocumentIngestor, TextIngestor


class AlephSupport(object):

    EXTENSIONS = []
    BASE_SCORE = 5

    @classmethod
    def match(cls, meta, local_path):
        score = -1

        # Let's use the ingestors package matching as a backup.
        with io.open(local_path, 'rb') as fio:
            _, mime_type = TextIngestor.match(fio)

        if meta.mime_type in cls.MIME_TYPES:
            score += cls.BASE_SCORE
        if mime_type in cls.MIME_TYPES:
            score += cls.BASE_SCORE
        if meta.extension in cls.EXTENSIONS:
            score += cls.BASE_SCORE
        return score


class AlephTextIngestor(AlephSupport, TextIngestor):
    pass


class AlephPDFIngestor(AlephSupport, PDFIngestor):
    pass


class AlephDocumentIngestor(AlephSupport, DocumentIngestor):
    pass
