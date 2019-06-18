import email
import logging
from email.policy import default
from email.errors import MessageError
from pantomime import normalize_mimetype
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.email import EmailSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class RFC822Ingestor(Ingestor, EmailSupport):
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

    def ingest(self, file_path, entity):
        entity.schema = model.get('Email')
        try:
            with open(file_path, 'rb') as fh:
                msg = email.message_from_binary_file(fh, policy=default)
        except MessageError as err:
            log.exception("Error parsing email.")
            raise ProcessingException('Cannot parse email: %s' % err)

        self.extract_msg_headers(entity, msg)

        for part in msg.walk():
            mime_type = normalize_mimetype(part.get_content_type())
            payload = part.get_payload(decode=True)
            if part.is_attachment():
                file_name = part.get_filename()
                self.ingest_attachment(entity,
                                       file_name,
                                       mime_type,
                                       payload)
            if not part.is_attachment() and not part.is_multipart():
                charset = part.get_content_charset()
                if charset is not None:
                    # TODO: do we want to do chardet after decoding fails?
                    payload = payload.decode(charset, 'replace')

                if 'text/html' in mime_type:
                    entity.set('bodyHtml', payload)
                if 'text/plain' in mime_type:
                    entity.set('bodyText', payload)
