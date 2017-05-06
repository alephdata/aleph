from ingestors import PDFIngestor, DocumentIngestor, TextIngestor


class AlephSupport(object):

    EXTENSIONS = []
    BASE_SCORE = 5

    @classmethod
    def match(cls, meta, local_path):
        score = -1
        if meta.mime_type in cls.MIME_TYPES:
            score += cls.BASE_SCORE
        if meta.extension in cls.EXTENSIONS:
            score += cls.BASE_SCORE
        return score

    pass


class AlephTextIngestor(AlephSupport, TextIngestor):
    pass


class AlephPDFIngestor(AlephSupport, PDFIngestor):
    pass


class AlephDocumentIngestor(AlephSupport, DocumentIngestor):
    pass
