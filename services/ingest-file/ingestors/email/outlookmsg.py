from __future__ import unicode_literals

import logging
from olefile import isOleFile
from email.parser import Parser
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.email import EmailSupport, EmailIdentity
from ingestors.support.ole import OLESupport
from ingestors.email.outlookmsg_lib import Message
from ingestors.util import safe_string

log = logging.getLogger(__name__)


class OutlookMsgIngestor(Ingestor, EmailSupport, OLESupport):
    MIME_TYPES = [
        'appliation/msg',
        'appliation/x-msg',
        'msg/rfc822'
    ]
    EXTENSIONS = ['msg']
    SCORE = 10

    def get_identity(self, name, email):
        return EmailIdentity(self.manager, name, email)

    def ingest(self, file_path, entity):
        entity.schema = model.get('Email')
        msg = Message(file_path)
        self.extract_olefileio_metadata(msg, entity)

        # This property information was sourced from
        # http://www.fileformat.info/format/outlookmsg/index.htm
        # on 2013-07-22.
        headers = msg.getField('007D')
        if headers is not None:
            try:
                msg_headers = Parser().parsestr(headers, headersonly=True)
                self.extract_msg_headers(entity, msg_headers)
            except Exception:
                log.exception("Cannot parse Outlook-stored headers")

        entity.add('bodyText', msg.getField('1000'))
        entity.add('messageId', msg.getField('1035'))
        entity.add('subject', msg.getField('0037'))
        entity.add('threadTopic', msg.getField('0070'))

        # sender name and email
        sender = self.get_identity(msg.getField('0C1A'), msg.getField('0C1F'))
        self.apply_identities(entity, sender, 'emitters', 'sender')

        # received by
        sender = self.get_identity(msg.getField('0040'), msg.getField('0076'))
        self.apply_identities(entity, sender, 'recipients')

        froms = self.get_identities(msg.getField('1046'))
        self.apply_identities(entity, froms, 'emitters', 'from')

        tos = self.get_identities(msg.getField('0E04'))
        self.apply_identities(entity, tos, 'recipients', 'to')

        ccs = self.get_identities(msg.getField('0E03'))
        self.apply_identities(entity, ccs, 'recipients', 'cc')

        bccs = self.get_identities(msg.getField('0E02'))
        self.apply_identities(entity, bccs, 'recipients', 'bcc')

        self.resolve_message_ids(entity)
        for attachment in msg.attachments:
            name = safe_string(attachment.longFilename)
            name = name or safe_string(attachment.shortFilename)
            self.ingest_attachment(entity, name,
                                   attachment.mimeType,
                                   attachment.data)

    @classmethod
    def match(cls, file_path, entity):
        if isOleFile(file_path):
            return super(OutlookMsgIngestor, cls).match(file_path, entity)
        return -1
