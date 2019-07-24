import logging
from msglite import Message
from olefile import isOleFile
from email.parser import Parser
from normality import stringify
from followthemoney import model
from email.utils import parsedate_to_datetime

from ingestors.ingestor import Ingestor
from ingestors.support.email import EmailSupport, EmailIdentity
from ingestors.support.ole import OLESupport
from ingestors.exc import ProcessingException


log = logging.getLogger(__name__)

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
        try:
            msg = Message(file_path)
        except Exception as exc:
            raise ProcessingException("Cannot open message file.") from msg
        
        self.extract_olefileio_metadata(msg, entity)

        try:
            self.extract_msg_headers(entity, msg.header)
        except Exception:
            log.exception("Cannot parse Outlook-stored headers")

        entity.add('encoding', msg.encoding)
        entity.add('bodyText', msg.body)
        entity.add('bodyHtml', msg.htmlBody)
        entity.add('messageId', msg.message_id)
        # entity.add('inReplyTo', msg.reply_to)
        entity.add('subject', msg.subject)
        entity.add('threadTopic', msg.getStringField('0070'))

        try:
            date = parsedate_to_datetime(msg.date).isoformat()
            entity.add('date', date)
        except Exception as exc:
            log.warning("Could not parse date: %s", msg.date)

        # sender name and email
        sender = self.get_identities(msg.sender)
        self.apply_identities(entity, sender, 'emitters', 'sender')

        # received by
        sender = self.get_identity(msg.getStringField('0040'), msg.getStringField('0076'))
        self.apply_identities(entity, sender, 'emitters')

        froms = self.get_identities(msg.getStringField('1046'))
        self.apply_identities(entity, froms, 'emitters', 'from')

        tos = self.get_identities(msg.to)
        self.apply_identities(entity, tos, 'recipients', 'to')

        ccs = self.get_identities(msg.cc)
        self.apply_identities(entity, ccs, 'recipients', 'cc')

        bccs = self.get_identities(msg.getStringField('0E02'))
        self.apply_identities(entity, bccs, 'recipients', 'bcc')

        self.resolve_message_ids(entity)
        for attachment in msg.attachments:
            if attachment.type != 'data':
                continue
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
