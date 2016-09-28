import os
import logging
import rfc822
import mailbox
import subprocess
from time import mktime
from datetime import datetime

from flanker import mime
from flanker.addresslib import address

from aleph.ingest import ingest_file, IngestorException
from aleph.ingest.text import TextIngestor
from aleph.ingest.html import HtmlIngestor
from aleph.ingest.document import DocumentIngestor
from aleph.util import make_tempfile, make_tempdir, remove_tempfile
from aleph.util import remove_tempdir

log = logging.getLogger(__name__)


class EmailFileIngestor(TextIngestor):
    MIME_TYPES = ['multipart/mixed']
    EXTENSIONS = ['eml', 'rfc822', 'email']
    BASE_SCORE = 6

    def write_temp(self, body, suffix=None):
        out_path = make_tempfile(suffix=suffix)
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
        child = meta.make_child()
        child.file_name = part.detected_file_name
        child.mime_type = part.detected_content_type

        # Weird outlook RTF representations -- do we want them?
        if child.file_name == 'rtf-body.rtf':
            return

        ingest_file(self.collection_id, child, out_path, move=True)
        remove_tempfile(out_path)

    def parse_headers(self, msg, meta):
        meta.title = msg.subject

        if msg.headers.get('Message-Id'):
            meta.foreign_id = unicode(msg.headers.get('Message-Id'))

        if msg.headers.get('From'):
            addr = address.parse(msg.headers.get('From'))
            if addr is not None:
                meta.author = addr.to_unicode()
                meta.add_email(addr.address)

        for hdr in ['To', 'CC', 'BCC']:
            if msg.headers.get(hdr):
                for addr in address.parse_list(msg.headers.get(hdr)):
                    meta.add_email(addr.address)

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
            self.ingest_message_data(meta, emlfh.read())

    def ingest_message_data(self, meta, data):
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
            raise IngestorException("No body in E-Mail: %r" % meta)
        try:
            if 'html' in body_type:
                out_path = self.write_temp(body_part, 'htm')
                ing = HtmlIngestor(self.collection_id)
            else:
                out_path = self.write_temp(body_part, 'txt')
                ing = DocumentIngestor(self.collection_id)
            ing.ingest(meta, out_path)
        finally:
            remove_tempfile(out_path)


class MboxFileIngestor(EmailFileIngestor):
    MIME_TYPES = ['application/mbox']
    EXTENSIONS = ['mbox']
    BASE_SCORE = 6

    def ingest(self, meta, local_path):
        mbox = mailbox.mbox(local_path)
        for msg in mbox:
            try:
                self.ingest_message_data(meta.clone(),
                                         msg.as_string())
            except Exception as ex:
                log.exception(ex)


class OutlookIngestor(TextIngestor):
    MIME_TYPES = ['application/vnd.ms-outlook']
    EXTENSIONS = ['pst']
    BASE_SCORE = 5

    def ingest(self, meta, local_path):
        work_dir = make_tempdir()
        try:
            bin_path = os.environ.get('READPST_BIN', 'readpst')
            args = [bin_path, '-D', '-e', '-o', work_dir, local_path]
            log.debug('Converting Outlook PST file: %r', ' '.join(args))
            subprocess.call(args)
            for (dirpath, dirnames, filenames) in os.walk(work_dir):
                reldir = os.path.relpath(dirpath, work_dir)
                for filename in filenames:
                    child = meta.make_child()
                    for kw in reldir.split(os.path.sep):
                        child.add_keyword(kw)
                    child.foreign_id = os.path.join(meta.foreign_id, reldir,
                                                    filename)
                    ingest_file(self.collection_id, meta,
                                os.path.join(dirpath, filename), move=True)
        finally:
            remove_tempdir(work_dir)
