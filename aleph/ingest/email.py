import os
import logging
import shutil
import rfc822
import subprocess
from tempfile import mkstemp, mkdtemp
from time import mktime
from datetime import datetime

from flanker import mime
from flanker.addresslib import address

from aleph.ingest import ingest_file
from aleph.ingest.text import TextIngestor
from aleph.ingest.html import HtmlIngestor
from aleph.ingest.document import DocumentIngestor

log = logging.getLogger(__name__)


class EmailFileIngestor(TextIngestor):
    MIME_TYPES = ['multipart/mixed']
    EXTENSIONS = ['eml', 'rfc822', 'email']
    BASE_SCORE = 6

    def write_temp(self, body, suffix=''):
        fh, out_path = mkstemp(suffix=suffix)
        os.close(fh)
        with open(out_path, 'w') as fh:
            if isinstance(body, unicode):
                body = body.encode('utf-8')
            fh.write(body)
        return out_path

    def ingest_attachment(self, part, meta):
        name, ext = os.path.splitext(part.detected_file_name)
        if len(ext):
            ext = ext.strip().lower()
        body = part.body
        if body is None:
            return
        out_path = self.write_temp(body, ext)
        child = meta.clone()
        child.clear('title')
        child.clear('extension')
        child.clear('mime_type')
        child.clear('file_name')
        child.parent = meta.clone()
        child.file_name = unicode(part.detected_file_name)
        child.mime_type = unicode(part.detected_content_type)
        # print unicode(part.detected_content_type)

        # Weird outlook RTF representations -- do we want them?
        if child.file_name == 'rtf-body.rtf':
            return

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
        body_part = msg.body

        for part in msg.walk():
            if not part.is_body():
                self.ingest_attachment(part, meta)
                continue

            body = part.body
            if 'html' not in body_type and \
                    body is not None and len(body.strip()):
                body_type = unicode(part.detected_content_type)
                body_part = body

        out_path = ''
        if body_part is None:
            log.warning("No body in E-Mail: %r" % meta)
            return
        try:
            if 'html' in body_type:
                out_path = self.write_temp(body_part, '.htm')
                ing = HtmlIngestor(self.source_id)
            else:
                out_path = self.write_temp(body_part, '.txt')
                ing = DocumentIngestor(self.source_id)
            ing.ingest(meta, out_path)
        finally:
            if out_path is not None and len(out_path) and \
                    os.path.isfile(out_path):
                os.unlink(out_path)


class OutlookIngestor(TextIngestor):
    MIME_TYPES = ['application/vnd.ms-outlook']
    EXTENSIONS = ['pst']
    BASE_SCORE = 5

    def ingest_message(self, filepath, meta):
        child = meta.clone()
        child.clear('title')
        child.clear('extension')
        child.clear('file_name')
        child.clear('mime_type')
        child.parent = meta.clone()
        child.source_path = filepath
        ingest_file(self.source_id, child, filepath, move=True)

    def ingest(self, meta, local_path):
        work_dir = mkdtemp()
        try:
            bin_path = os.environ.get('READPST_BIN', 'readpst')
            args = [bin_path, '-D', '-e', '-o', work_dir, local_path]
            log.debug('Converting Outlook PST file: %r', ' '.join(args))
            subprocess.call(args)
            for (dirpath, dirnames, filenames) in os.walk(work_dir):
                child = meta.clone()
                relpath = os.path.relpath(dirpath, work_dir)
                for kw in relpath.split(os.path.sep):
                    child.add_keyword(kw)
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    self.ingest_message(filepath, child)
        except Exception as ex:
            self.log_exception(meta, ex)
        finally:
            shutil.rmtree(work_dir)
