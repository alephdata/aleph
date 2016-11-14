import six
import rfc822
import logging
from time import mktime
from datetime import datetime

from ExtractMsg import Message
from olefile import isOleFile
from flanker.addresslib import address

from aleph.ingest import ingest_file
from aleph.ingest.text import TextIngestor
from aleph.ingest.document import DocumentIngestor
from aleph.text import string_value
from aleph.util import make_tempfile, remove_tempfile

log = logging.getLogger(__name__)


class OutlookMsgIngestor(TextIngestor):
    MIME_TYPES = []
    EXTENSIONS = ['msg']
    BASE_SCORE = 10

    def ingest_attachment(self, attachment, meta):
        try:
            if attachment.data is None:
                log.warning("Attachment is empty [%r]: %s",
                            meta, attachment.longFilename)
                return
            out_path = make_tempfile()
            with open(out_path, 'w') as fh:
                fh.write(attachment.data)
            child = meta.make_child()
            child.file_name = string_value(attachment.longFilename)
            ingest_file(self.collection_id, child, out_path, move=True)
            remove_tempfile(out_path)
        except Exception as ex:
            log.exception(ex)

    def parse_headers(self, header, meta):
        meta.title = header.get('Subject')

        if header.get('Message-Id'):
            meta.foreign_id = string_value(header.get('Message-Id'))

        if header.get('From'):
            addr = address.parse(header.get('From'))
            if addr is not None:
                meta.author = addr.to_unicode()
                meta.add_email(addr.address)

        for hdr in ['To', 'CC', 'BCC']:
            if header.get(hdr):
                for addr in address.parse_list(header.get(hdr)):
                    meta.add_email(addr.address)

        date = header.get('Date')
        date = rfc822.parsedate(date)
        if date is not None:
            dt = datetime.fromtimestamp(mktime(date))
            meta.add_date(dt)

        meta.headers = dict([(k, string_value(v)) for k, v in
                             header.items()])
        return meta

    def ingest(self, meta, local_path):
        message = Message(local_path)
        if message.header is not None:
            meta = self.parse_headers(message.header, meta)

        for attachment in message.attachments:
            self.ingest_attachment(attachment, meta)

        if message.body is not None:
            out_path = make_tempfile(suffix='txt')
            with open(out_path, 'w') as fh:
                # TODO: figure out if this is really IMAP UTF-7
                body = string_value(message.body)
                fh.write(body.encode('utf-8'))
            ing = DocumentIngestor(self.collection_id)
            ing.ingest(meta, out_path)
            remove_tempfile(out_path)

    @classmethod
    def match(cls, meta, local_path):
        if isOleFile(local_path):
            if meta.mime_type in cls.MIME_TYPES:
                return cls.BASE_SCORE
            if meta.extension in cls.EXTENSIONS:
                return cls.BASE_SCORE
        return -1
