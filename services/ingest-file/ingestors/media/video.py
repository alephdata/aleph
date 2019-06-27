import logging
from followthemoney import model
from pymediainfo import MediaInfo

from ingestors.ingestor import Ingestor
from ingestors.support.timestamp import TimestampSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class VideoIngestor(Ingestor, TimestampSupport):
    MIME_TYPES = [
        'application/x-shockwave-flash',
        'video/quicktime',
        'video/mp4',
        'video/x-flv',
    ]
    EXTENSIONS = [
        'avi',
        'mpg',
        'mpeg',
        'mkv',
        'mp4',
        'mov',
    ]
    SCORE = 3

    def ingest(self, file_path, entity):
        try:
            entity.schema = model.get('Video')
            log.info("[%r] flagged as video.", entity)
            metadata = MediaInfo.parse(file_path)
            for track in metadata.tracks:
                entity.add('title', track.title)
                entity.add('generator', track.writing_application)
                entity.add('generator', track.writing_library)
                entity.add('generator', track.publisher)
                entity.add('authoredAt', self.parse_timestamp(track.recorded_date))  # noqa
                entity.add('authoredAt', self.parse_timestamp(track.tagged_date))  # noqa
                entity.add('authoredAt', self.parse_timestamp(track.encoded_date))  # noqa
                modified_at = self.parse_timestamp(track.file_last_modification_date)  # noqa
                entity.add('modifiedAt', modified_at)
                entity.add('duration', track.duration)
        except Exception as ex:
            raise ProcessingException("Could not read video: %r", ex) from ex

    @classmethod
    def match(cls, file_path, entity):
        score = super(VideoIngestor, cls).match(file_path, entity)
        if score <= 0:
            for mime_type in entity.get('mimeType'):
                if mime_type.startswith('video/'):
                    return cls.SCORE * 2
        return score
