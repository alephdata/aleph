import re
import types
import logging
from banal import ensure_list
from normality import stringify
from balkhash.utils import safe_fragment
from email.utils import parsedate_to_datetime, getaddresses
from normality import safe_filename, ascii_text
from followthemoney.types import registry

from ingestors.support.html import HTMLSupport
from ingestors.support.cache import CacheSupport
from ingestors.support.temp import TempFileSupport

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

        # This should be using formataddr, but I cannot figure out how
        # to use that without encoding the name.
        self.label = None
        if self.name is not None and self.email is not None:
            self.label = '%s <%s>' % (self.name, self.email)
        elif self.name is None and self.email is not None:
            self.label = self.email
        elif self.email is None and self.name is not None:
            self.label = self.name

        self.entity = None
        if self.email is not None:
            key = self.email.lower().strip()
            fragment = safe_fragment(self.label)
            self.entity = manager.make_entity('Person')
            self.entity.make_id(key)
            self.entity.add('name', self.name)
            self.entity.add('email', self.email)
            manager.emit_entity(self.entity, fragment=fragment)


class EmailSupport(TempFileSupport, HTMLSupport, CacheSupport):
    """Extract metadata from email messages."""
    MID_RE = re.compile(r'<([^>]*)>')

    def ingest_attachment(self, entity, name, mime_type, body):
        has_body = body is not None and len(body)
        if stringify(name) is None and not has_body:
            # Hello, Outlook.
            return

        file_name = safe_filename(name, default='attachment')
        file_path = self.make_work_file(file_name)
        with open(file_path, 'wb') as fh:
            if isinstance(body, str):
                body = body.encode('utf-8')
            if body is not None:
                fh.write(body)

        checksum = self.manager.store(file_path, mime_type=mime_type)
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
            try:
                for value in ensure_list(msg.get_all(header)):
                    values.append(value)
            except (TypeError, IndexError, AttributeError, ValueError) as exc:
                log.warning("Failed to parse [%s]: %s", header, exc)
        return values

    def get_dates(self, msg, *headers):
        dates = []
        for value in self.get_header(msg, *headers):
            try:
                dates.append(parsedate_to_datetime(value))
            except Exception:
                log.warning("Failed to parse: %s", value)
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

    def parse_message_ids(self, values):
        message_ids = []
        for value in ensure_list(values):
            value = stringify(value)
            if value is None:
                continue
            for message_id in self.MID_RE.findall(value):
                message_id = message_id.strip()
                if len(message_id) <= 4:
                    continue
                message_ids.append(message_id)
        return message_ids

    def parse_references(self, references, in_reply_to):
        references = self.parse_message_ids(references)
        if len(references):
            return references[-1]
        in_reply_to = self.parse_message_ids(in_reply_to)
        if len(in_reply_to):
            return in_reply_to[0]

    def resolve_message_ids(self, entity):
        # https://cr.yp.to/immhf/thread.html
        ctx = self.manager.stage.job.dataset.name

        for message_id in entity.get('messageId'):
            key = self.cache_key('mid-ent', ctx, message_id)
            self.add_cache_set(key, entity.id)

            rev_key = self.cache_key('ent-mid', ctx, message_id)
            for response_id in self.get_cache_set(rev_key):
                if response_id == entity.id:
                    continue
                email = self.manager.make_entity('Email')
                email.id = response_id
                email.add('inReplyToEmail', entity.id)
                fragment = safe_fragment(message_id)
                self.manager.emit_entity(email, fragment=fragment)

        for message_id in entity.get('inReplyTo'):
            # forward linking: from message ID to entity ID
            key = self.cache_key('mid-ent', ctx, message_id)
            for email_id in self.get_cache_set(key):
                if email_id != entity.id:
                    entity.add('inReplyToEmail', email_id)

            # backward linking: prepare entity ID for message to come
            rev_key = self.cache_key('ent-mid', ctx, message_id)
            self.add_cache_set(rev_key, entity.id)

    def extract_msg_headers(self, entity, msg):
        """Parse E-Mail headers into FtM properties."""
        try:
            entity.add('indexText', msg.values())
        except Exception as ex:
            log.warning("Cannot parse all headers: %r", ex)
        entity.add('subject', self.get_header(msg, 'Subject'))
        entity.add('date', self.get_dates(msg, 'Date'))
        entity.add('mimeType', self.get_header(msg, 'Content-Type'))
        entity.add('threadTopic', self.get_header(msg, 'Thread-Topic'))
        entity.add('generator', self.get_header(msg, 'X-Mailer'))
        entity.add('language', self.get_header(msg, 'Content-Language'))
        entity.add('keywords', self.get_header(msg, 'Keywords'))
        entity.add('summary', self.get_header(msg, 'Comments'))
        message_id = self.get_header(msg, 'Message-ID')
        entity.add('messageId', self.parse_message_ids(message_id))
        references = self.get_header(msg, 'References')
        in_reply_to = self.get_header(msg, 'In-Reply-To')
        entity.add('inReplyTo', self.parse_references(references, in_reply_to))

        return_path = self.get_header_identities(msg, 'Return-Path')
        self.apply_identities(entity, return_path)

        reply_to = self.get_header_identities(msg, 'Reply-To')
        self.apply_identities(entity, reply_to)

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
