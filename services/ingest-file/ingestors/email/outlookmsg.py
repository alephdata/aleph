from __future__ import unicode_literals

import logging
from olefile import isOleFile
from email.parser import Parser
from normality import stringify
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.email import EmailSupport, EmailIdentity
from ingestors.support.ole import OLESupport
from extract_msg import Message

log = logging.getLogger(__name__)


class FieldMessage(Message):

    def getField(self, name):
        return self._getStringStream('__substg1.0_%s' % name)


class OutlookMsgIngestor(Ingestor, EmailSupport, OLESupport):
    MIME_TYPES = [
        'application/msg',
        'application/x-msg',
        'msg/rfc822'
    ]
    EXTENSIONS = ['msg']
    SCORE = 10

    def get_identity(self, name, email):
        return EmailIdentity(self.manager, name, email)

    def ingest(self, file_path, entity):
        entity.schema = model.get('Email')
        msg = FieldMessage(file_path)
        self.extract_olefileio_metadata(msg, entity)

        try:
            self.extract_msg_headers(entity, msg.header)
        except Exception:
            log.exception("Cannot parse Outlook-stored headers")

        entity.add('bodyText', msg.body)
        entity.add('bodyHtml', msg.htmlBody)
        entity.add('messageId', msg.message_id)
        # entity.add('inReplyTo', msg.reply_to)
        entity.add('subject', msg.subject)
        entity.add('threadTopic', msg.getField('0070'))
        entity.add('date', msg.parsedDate)

        # sender name and email
        sender = self.get_identities(msg.sender)
        self.apply_identities(entity, sender, 'emitters', 'sender')

        # received by
        sender = self.get_identity(msg.getField('0040'), msg.getField('0076'))
        self.apply_identities(entity, sender, 'emitters')

        froms = self.get_identities(msg.getField('1046'))
        self.apply_identities(entity, froms, 'emitters', 'from')

        tos = self.get_identities(msg.to)
        self.apply_identities(entity, tos, 'recipients', 'to')

        ccs = self.get_identities(msg.cc)
        self.apply_identities(entity, ccs, 'recipients', 'cc')

        bccs = self.get_identities(msg.getField('0E02'))
        self.apply_identities(entity, bccs, 'recipients', 'bcc')

        self.resolve_message_ids(entity)
        for attachment in msg.attachments:
            name = stringify(attachment.longFilename)
            name = name or stringify(attachment.shortFilename)
            self.ingest_attachment(entity, name,
                                   attachment.type,
                                   attachment.data)

    @classmethod
    def match(cls, file_path, entity):
        if isOleFile(file_path):
            return super(OutlookMsgIngestor, cls).match(file_path, entity)
        return -1
