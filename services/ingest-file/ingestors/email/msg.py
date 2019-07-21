import email
import logging
from email.policy import default
from email.errors import MessageError
from pantomime import normalize_mimetype
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.email import EmailSupport
from ingestors.support.encoding import EncodingSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class RFC822Ingestor(Ingestor, EmailSupport, EncodingSupport):
    MIME_TYPES = [
        'multipart/mixed',
        'message/rfc822'
    ]
    EXTENSIONS = [
        'eml',
        'rfc822',
        'email',
        'msg'
    ]
    SCORE = 7

    def extract_msg_body(self, entity, part):
        if part.is_attachment() or part.is_multipart():
            return
        mime_type = normalize_mimetype(part.get_content_type())
        payload = part.get_payload(decode=True)
        charset = part.get_content_charset()
        payload = self.decode_string(payload, charset)

        if 'text/html' in mime_type:
            self.extract_html_content(entity, payload, extract_metadata=False)
        if 'text/plain' in mime_type:
            entity.add('bodyText', payload)

    def ingest(self, file_path, entity):
        entity.schema = model.get('Email')
        try:
            with open(file_path, 'rb') as fh:
                msg = email.message_from_binary_file(fh, policy=default)
        except MessageError as err:
            raise ProcessingException('Cannot parse email: %s' % err) from err

        self.extract_msg_headers(entity, msg)
        self.extract_msg_body(entity, msg)
        self.resolve_message_ids(entity)

        for part in msg.walk():
            self.extract_msg_body(entity, part)
            if part.is_attachment():
                mime_type = normalize_mimetype(part.get_content_type())
                payload = part.get_payload(decode=True)
                file_name = part.get_filename()
                self.ingest_attachment(entity,
                                       file_name,
                                       mime_type,
                                       payload)
