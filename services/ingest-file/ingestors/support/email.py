from __future__ import unicode_literals

import re
import logging
from time import mktime
from datetime import datetime
from email import utils as email_utils
from normality import safe_filename
from followthemoney.types import registry

from ingestors.support.html import HTMLSupport
from ingestors.support.temp import TempFileSupport
from ingestors.util import safe_string

log = logging.getLogger(__name__)

EMAIL_REGEX = re.compile(r"[^@]+@[^@]+\.[^@]+")


class EmailSupport(TempFileSupport, HTMLSupport):
    """Extract metadata from email messages."""

    def ingest_attachment(self, entity, name, mime_type, body):
        has_body = body is not None and len(body)
        if safe_string(name) is None and not has_body:
            # Hello, Outlook.
            return

        file_name = safe_filename(name, default='attachment')
        file_path = self.make_work_file(file_name)
        with open(file_path, 'wb') as fh:
            if isinstance(body, str):
                body = body.encode('utf-8')
            if body is not None:
                fh.write(body)

        if isinstance(mime_type, bytes):
            mime_type = mime_type.decode('utf-8')

        checksum = self.manager.archive_store(file_path)
        child = self.manager.make_entity('Document', parent=entity)
        child.make_id(name, checksum)
        child.add('contentHash', checksum)
        child.add('fileName', name)
        child.add('mimeType', mime_type)
        self.manager.queue_entity(child)

    def check_email(self, text):
        """Does it roughly look like an email?"""
        if text is None:
            return False
        if EMAIL_REGEX.match(text):
            return True
        return False

    def parse_emails(self, text, entity):
        """Parse an email list with the side effect of adding them to the
        relevant result lists."""
        values = []
        text = safe_string(text)
        if text:
            parsed = email_utils.getaddresses([text])
            # If the snippet didn't parse, assume it is just a name.
            if not len(parsed):
                return [(text, None, None)]
            for name, email in parsed:
                if not self.check_email(email):
                    email = None

                if self.check_email(name):
                    email = email or name
                    name = None

                if email:
                    legal_entity = self.manager.make_entity('LegalEntity')
                    legal_entity.make_id(email)
                    legal_entity.add('name', name)
                    legal_entity.add('email', email)
                    self.manager.emit_entity(legal_entity)

                    entity.add('emailMentioned', email)
                    entity.add('namesMentioned', name)
                    values.append((name, email, legal_entity))
        return values

    def extract_headers_metadata(self, entity, headers):
        headers = dict(headers)
        entity.add('headers', registry.json.pack(dict(headers)))
        headers = [(safe_string(k), safe_string(v)) for k, v in headers.items()]  # noqa
        for field, value in headers:
            field = field.lower()

            if field == 'subject':
                entity.add('title', value)
                entity.add('subject', value)

            if field == 'message-id':
                entity.add('messageId', value)

            if field == 'in-reply-to':
                entity.add('inReplyTo', value)
            if field == 'references':
                for email_addr in value.split():
                    entity.add('inReplyTo', email_addr)

            if field == 'date':
                date = value
                try:
                    date = email_utils.parsedate(date)
                    date = datetime.fromtimestamp(mktime(date))
                    entity.add('authoredAt', date)
                except Exception as ex:
                    log.warning("Failed to parse [%s]: %s", date, ex)

            if field == 'from':
                for (name, _, sender) in self.parse_emails(value, entity):
                    entity.add('author', name)
                    if sender:
                        entity.add('sender', sender)

            if field in ['to', 'cc', 'bcc']:
                entity.add(field, value)
                for (_, _, receipient) in self.parse_emails(value, entity):
                    if receipient:
                        entity.add('recipients', receipient)
