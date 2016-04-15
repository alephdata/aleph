import os
import logging
import rfc822
from normality import slugify
from tempfile import mkstemp
from time import mktime
from datetime import datetime

from flanker import mime
from flanker.addresslib import address

from aleph.ingest import ingest_file
from aleph.ingest.text import TextIngestor, DocumentIngestor, HtmlIngestor

log = logging.getLogger(__name__)


class EmailFileIngestor(TextIngestor):
    MIME_TYPES = ['multipart/mixed']
    EXTENSIONS = ['eml', 'rfc822', 'email', 'msg']
    BASE_SCORE = 5

    def write_temp(self, part, suffix=''):
        fh, out_path = mkstemp(suffix=suffix)
        os.close(fh)
        with open(out_path, 'w') as fh:
            body = part.body
            if isinstance(part.body, unicode):
                body = body.encode('utf-8')
            fh.write(body)
        return out_path

    def ingest_attachment(self, part, meta):
        name, ext = os.path.splitext(part.detected_file_name)
        if len(ext):
            ext = ext.strip().lower()
        out_path = self.write_temp(part, ext)
        child = meta.clone()
        child.clear('title')
        child.clear('extension')
        child.parent = meta.clone()
        child.file_name = unicode(part.detected_file_name)
        child.mime_type = unicode(part.detected_content_type)
        ingest_file(self.source_id, child, out_path, move=True)

    def parse_headers(self, msg, meta):
        meta.title = msg.subject

        if msg.headers.get('Message-Id'):
            meta.foreign_id = unicode(msg.headers.get('Message-Id'))

        if msg.headers.get('From'):
            addr = address.parse(msg.headers.get('From'))
            if addr is not None:
                meta.author = addr.to_unicode()

        for hdr in ['To', 'CC', 'BCC']:
            if msg.headers.get(hdr):
                for addr in address.parse_list(msg.headers.get(hdr)):
                    meta.add_recipient(addr.to_unicode())

        date = msg.headers.get('Date')
        date = rfc822.parsedate(date)
        if date is not None:
            dt = datetime.fromtimestamp(mktime(date))
            meta.add_date(dt)

        meta.headers = dict([(k, unicode(v)) for k, v in
                             msg.headers.items()])
        return meta

    def ingest(self, meta, local_path):
        with open(local_path, 'rb') as emlfh:
            data = emlfh.read()
            msg = mime.from_string(data)
            meta = self.parse_headers(msg, meta)

            body_type = 'text/plain'
            body_part = msg

            for part in msg.walk():
                if not part.is_body():
                    self.ingest_attachment(part, meta)
                elif 'html' not in body_type:
                    body_type = unicode(part.detected_file_name)
                    body_part = part

            out_path = ''
            try:
                if 'html' in body_type:
                    out_path = self.write_temp(body_part, '.htm')
                    ing = HtmlIngestor(self.source_id)
                else:
                    out_path = self.write_temp(body_part, '.txt')
                    ing = DocumentIngestor(self.source_id)
                ing.ingest(meta, out_path)
            finally:
                if os.path.isfile(out_path):
                    os.unlink(out_path)
