import logging
from collections import defaultdict
from pantomime import normalize_mimetype
import email
from email.errors import MessageError
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
        with open(file_path, 'rb') as fh:
            self.ingest_message(fh, entity)

    def ingest_message(self, fp, entity):
        entity.schema = model.get('Email')
        entity.set('bodyText', None)
        try:
            msg = email.message_from_binary_file(fp)
            parser = email.parser.HeaderParser()
            headers = parser.parsestr(msg.as_string())
            if headers is not None:
                self.extract_headers_metadata(entity, headers.items())
        except MessageError as err:
            raise ProcessingException('Cannot parse email: %s' % err)

        bodies = defaultdict(list)

        for part in msg.walk():
            try:
                body = part.get_payload(decode=True)
                if not isinstance(body, bytes):
                    continue
            except (MessageError, ValueError) as err:
                log.warning("Cannot decode part [%s]: %s", entity, err)
                continue

            file_name = part.get_filename()

            # HACK HACK HACK - WTF flanker?
            # Disposition headers can have multiple filename declarations,
            # flanker decides to concatenate.
            # if file_name is not None and len(file_name) > 4:
            #     half = len(file_name)//2
            #     if file_name[:half] == file_name[half:]:
            #         file_name = file_name[:half]

            mime_type = str(part.get_content_type())
            mime_type = normalize_mimetype(mime_type)

            if part.get_content_maintype() == 'text':
                bodies[mime_type].append(body.decode('utf-8'))
            else:
                self.ingest_attachment(entity,
                                       file_name,
                                       mime_type,
                                       body)

        if 'text/html' in bodies:
            body = '\n\n'.join(bodies['text/html'])
            entity.set('bodyHtml', body)

        if 'text/plain' in bodies:
            body = '\n\n'.join(bodies['text/plain'])
            entity.set('bodyHtml', body)
            entity.set('bodyText', body)
