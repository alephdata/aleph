import os
import six
import logging
import rfc822
import mailbox
import subprocess
from time import mktime
from datetime import datetime

from flanker import mime
from flanker.addresslib import address

from aleph.ingest import ingest_file
from aleph.ingest.text import TextIngestor
from aleph.ingest.html import HtmlIngestor
from aleph.ingest.document import DocumentIngestor
from aleph.text import string_value
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

    def write_text(self, body, suffix=None):
        body = string_value(body)
        if body is None:
            body = u''
        return self.write_temp(body, suffix=suffix)

    def ingest_attachment(self, part, meta):
        file_name = string_value(part.detected_file_name)
        name, ext = os.path.splitext(file_name)
        if len(ext):
            ext = ext.strip().lower()
        body = part.body
        if body is None:
            log.debug("Empty attachment [%r]: %s", meta, part)
            return
        out_path = self.write_temp(body, ext)
        child = meta.make_child()
        child.file_name = six.text_type(file_name)
        child.mime_type = six.text_type(part.detected_content_type)

        try:
            ingest_file(self.collection_id, child, out_path, move=True)
        finally:
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
        bodies = {'text/plain': msg.body}

        for part in msg.walk():
            if part.is_body():
                content_type = six.text_type(part.content_type)
                bodies[content_type] = part.body
            else:
                self.ingest_attachment(part, meta)

        try:
            if 'text/html' in bodies:
                out_path = self.write_text(bodies['text/html'], 'htm')
                HtmlIngestor(self.collection_id).ingest(meta, out_path)
            elif 'text/plain' in bodies:
                out_path = self.write_text(bodies['text/plain'], 'txt')
                DocumentIngestor(self.collection_id).ingest(meta, out_path)
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
            args = [bin_path, '-D', '-e', '-8', '-b', '-o',
                    work_dir, local_path]
            log.debug('Converting Outlook PST file: %r', ' '.join(args))
            subprocess.call(args)
            for (dirpath, dirnames, filenames) in os.walk(work_dir):
                reldir = os.path.relpath(string_value(dirpath),
                                         string_value(work_dir))
                for filename in filenames:
                    filename = string_value(filename)
                    child = meta.make_child()
                    for kw in reldir.split(os.path.sep):
                        child.add_keyword(kw)
                    fid = os.path.join(string_value(meta.foreign_id),
                                       string_value(reldir), filename)
                    child.foreign_id = string_value(fid)
                    file_path = os.path.join(string_value(dirpath), filename)
                    ingest_file(self.collection_id, child, file_path, move=True)
        finally:
            remove_tempdir(work_dir)
