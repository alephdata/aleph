from __future__ import unicode_literals

import logging
from olefile import isOleFile
from email.parser import Parser
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.email import EmailSupport
from ingestors.support.ole import OLESupport
from ingestors.email.outlookmsg_lib import Message
from ingestors.util import safe_string, safe_dict

log = logging.getLogger(__name__)


class OutlookMsgIngestor(Ingestor, EmailSupport, OLESupport):
    MIME_TYPES = [
        'appliation/msg',
        'appliation/x-msg',
        'message/rfc822'
    ]
    EXTENSIONS = ['msg']
    SCORE = 10

    def _parse_headers(self, entity, message):
        headers = message.getField('007D')
        if headers is not None:
            try:
                msg = Parser().parsestr(headers, headersonly=True)
                self.extract_headers_metadata(entity, msg.items())
                return
            except Exception:
                log.warning("Cannot parse headers: %s" % headers)

        headers = safe_dict({
            'Subject': message.getField('0037'),
            'BCC': message.getField('0E02'),
            'CC': message.getField('0E03'),
            'To': message.getField('0E04'),
            'From': message.getField('1046'),
            'Message-ID': message.getField('1035'),
        })
        self.extract_headers_metadata(entity, headers)

    def ingest(self, file_path, entity):
        entity.schema = model.get('Email')
        message = Message(file_path)
        self._parse_headers(entity, message)
        entity.add('bodyText', message.getField('1000'))
        entity.add('messageId', message.getField('1035'))

        # all associated person names, i.e. sender, recipient etc.
        NAME_FIELDS = ['0C1A', '0E04', '0040', '004D']
        EMAIL_FIELDS = ['0C1F', '0076', '0078', '1046', '3003',
                        '0065', '3FFC', '403E']
        for field in NAME_FIELDS + EMAIL_FIELDS:
            self.parse_emails(message.getField(field), entity)

        entity.add('subject', message.getField('0037'))
        entity.add('summary', message.getField('0070'))
        entity.add('author', message.getField('0C1A'))

        self.extract_olefileio_metadata(message, entity)
        for attachment in message.attachments:
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
