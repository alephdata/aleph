import logging
import mailbox
from pantomime.types import RFC822
from followthemoney import model

from ingestors.email.msg import RFC822Ingestor
from ingestors.support.temp import TempFileSupport

log = logging.getLogger(__name__)


class MboxFileIngestor(RFC822Ingestor, TempFileSupport):
    DEFAULT_MIME = 'application/mbox'
    MIME_TYPES = [DEFAULT_MIME]
    EXTENSIONS = ['mbox']
    MAGIC = 'From '
    SCORE = 6

    def ingest(self, file_path, entity):
        mbox = mailbox.mbox(file_path)
        entity.schema = model.get('Package')
        entity.add('mimeType', self.DEFAULT_MIME)

        for i, msg in enumerate(mbox.itervalues(), 1):
            # Is there a risk of https://bugs.python.org/issue27321 ?
            try:
                msg_path = self.make_work_file('%s.eml' % i)
                with open(msg_path, 'wb') as fh:
                    fh.write(msg.as_bytes())
                checksum = self.manager.store(msg_path, mime_type=RFC822)
                msg_path.unlink()
                child = self.manager.make_entity('Email', parent=entity)
                child.make_id(checksum)
                child.add('contentHash', checksum)
                child.add('mimeType', RFC822)
                self.manager.queue_entity(child)
            except Exception:
                log.exception("[%r] Cannot extract message %s", entity, i)

    @classmethod
    def match(cls, file_path, entity):
        score = super(MboxFileIngestor, cls).match(file_path, entity)
        if score < 0:
            # this was added because a lot of mbox files are just called
            # 'inbox' or 'new', without a file suffix.
            with open(file_path, 'rb') as fh:
                if fh.read(len(cls.MAGIC)) == cls.MAGIC:
                    mbox = mailbox.mbox(file_path)
                    for msg in mbox:
                        return cls.SCORE
        return score
