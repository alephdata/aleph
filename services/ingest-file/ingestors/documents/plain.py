from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.encoding import EncodingSupport
from ingestors.exc import ProcessingException


class PlainTextIngestor(Ingestor, EncodingSupport):
    """Plan text file ingestor class.

    Extracts the text from the document and enforces unicode on it.
    """

    MIME_TYPES = [
        "text/plain",
        "text/x-c",
        "text/x-c++",
        "text/x-diff",
        "text/x-python",
        "text/x-shellscript",
        "text/x-java",
        "text/x-php",
        "text/troff",
        "text/x-ruby",
        "text/x-pascal",
        "text/x-msdos-batch",
        "text/x-yaml",
        "text/x-makefile",
        "text/x-perl",  # %^&%*^&%*%^
        "text/x-objective-c",
        "text/x-msdos-batch",
        "text/x-asm",
        "text/x-csrc",
        "text/x-sh",
        "text/javascript",
        "text/x-algol68",
    ]
    EXTENSIONS = ["txt", "md", "rst", "nfo"]
    MAX_SIZE = 4 * 1024 * 1024
    SCORE = 1

    def ingest(self, file_path, entity):
        """Ingestor implementation."""
        entity.schema = model.get("PlainText")
        for file_size in entity.get("fileSize"):
            if int(file_size) > self.MAX_SIZE:
                raise ProcessingException("Text file is too large.")

        text = self.read_file_decoded(entity, file_path)
        entity.set("bodyText", text)
