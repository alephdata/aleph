import types
import logging
from banal import ensure_list
from email.utils import parsedate_to_datetime
from email.utils import getaddresses, formataddr
from normality import safe_filename, stringify, ascii_text
from followthemoney.types import registry

from ingestors.support.html import HTMLSupport
from ingestors.support.temp import TempFileSupport
from ingestors.util import safe_string

log = logging.getLogger(__name__)


class EmailIdentity(object):

    def __init__(self, manager, name, email):
        self.email = ascii_text(stringify(email))
        self.name = stringify(name)
        if not registry.email.validate(self.email):
            self.email = None
        if registry.email.validate(self.name):
            self.email = self.email or ascii_text(self.name)
            self.name = None
        self.label = stringify(formataddr((self.name or '', self.email or '')))
        self.entity = None
        if self.email is not None:
            key = self.email.lower().strip()
            self.entity = manager.make_entity('LegalEntity')
            self.entity.make_id(key)
            self.entity.add('name', self.name)
            self.entity.add('email', self.email)
            manager.emit_entity(self.entity)


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

        checksum = self.manager.archive_store(file_path)
        file_path.unlink()

        child = self.manager.make_entity('Document', parent=entity)
        child.make_id(name, checksum)
        child.add('contentHash', checksum)
        child.add('fileName', name)
        child.add('mimeType', mime_type)
        self.manager.queue_entity(child)

    def get_header(self, msg, *headers):
        values = []
        for header in headers:
            for value in ensure_list(msg.get_all(header)):
                values.append(value)
        return values

    def get_dates(self, msg, *headers):
        dates = []
        for value in self.get_header(msg, *headers):
            try:
                dates.append(parsedate_to_datetime(value))
            except Exception:
                log.debug("Failed to parse: %s", value)
        return dates

    def get_identities(self, values):
        values = [v for v in ensure_list(values) if v is not None]
        for (name, email) in getaddresses(values):
            yield EmailIdentity(self.manager, name, email)

    def get_header_identities(self, msg, *headers):
        yield from self.get_identities(self.get_header(msg, *headers))

    def apply_identities(self, entity, identities, eprop=None, lprop=None):
        if isinstance(identities, types.GeneratorType):
            identities = list(identities)
        for identity in ensure_list(identities):
            if eprop is not None:
                entity.add(eprop, identity.entity)
            if lprop is not None:
                entity.add(lprop, identity.label)
            entity.add('namesMentioned', identity.name)
            entity.add('emailMentioned', identity.email)

    def extract_msg_headers(self, entity, msg):
        """Parse E-Mail headers into FtM properties."""
        entity.add('indexText', msg.values())
        entity.add('subject', self.get_header(msg, 'Subject'))
        entity.add('date', self.get_dates(msg, 'Date'))
        entity.add('messageId', self.get_header(msg, 'Message-ID'))
        entity.add('inReplyTo', self.get_header(msg, 'In-Reply-To'))
        entity.add('mimeType', self.get_header(msg, 'Content-Type'))
        entity.add('threadTopic', self.get_header(msg, 'Thread-Topic'))
        entity.add('generator', self.get_header(msg, 'X-Mailer'))
        entity.add('language', self.get_header(msg, 'Content-Language'))
        entity.add('keywords', self.get_header(msg, 'Keywords'))
        entity.add('summary', self.get_header(msg, 'Comments'))

        return_path = self.get_header_identities(msg, 'Return-Path')
        self.apply_identities(entity, return_path, 'emitters')

        reply_to = self.get_header_identities(msg, 'Reply-To')
        self.apply_identities(entity, reply_to, 'emitters')

        sender = self.get_header_identities(msg, 'Sender', 'X-Sender')
        self.apply_identities(entity, sender, 'emitters', 'sender')

        froms = self.get_header_identities(msg, 'From', 'X-From')
        self.apply_identities(entity, froms, 'emitters', 'from')

        tos = self.get_header_identities(msg, 'To', 'Resent-To')
        self.apply_identities(entity, tos, 'recipients', 'to')

        ccs = self.get_header_identities(msg, 'CC', 'Cc', 'Resent-Cc')
        self.apply_identities(entity, ccs, 'recipients', 'cc')

        bccs = self.get_header_identities(msg, 'Bcc', 'BCC', 'Resent-Bcc')
        self.apply_identities(entity, bccs, 'recipients', 'bcc')
