import logging
from followthemoney import model
from pymediainfo import MediaInfo

from ingestors.ingestor import Ingestor
from ingestors.media.util import MediaInfoDateMixIn
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class AudioIngestor(Ingestor, MediaInfoDateMixIn):
    MIME_TYPES = [
        'audio/mpeg',
        'audio/mp3',
        'audio/x-m4a',
        'audio/x-hx-aac-adts',
        'audio/x-wav',
        'audio/mp4',
        'audio/ogg',
        'audio/vnd.wav',
        'audio/flac',
        'audio/x-ms-wma',
        'audio/webm',
    ]
    EXTENSIONS = [
        'wav',
        'mp3',
        'aac',
        'ac3',
        'm4a',
        'm4b',
        'ogg',
        'opus',
        'flac',
        'wma',
    ]
    SCORE = 3

    def ingest(self, file_path, entity):
        try:
            entity.schema = model.get('Audio')
            metadata = MediaInfo.parse(file_path)
            for track in metadata.tracks:
                entity.add('title', track.title)
                entity.add('generator', track.writing_application)
                entity.add('generator', track.writing_library)
                entity.add('generator', track.publisher)
                entity.add('authoredAt', self.parse_date(track.recorded_date))
                entity.add('authoredAt', self.parse_date(track.tagged_date))
                entity.add('authoredAt', self.parse_date(track.encoded_date))
                modified_at = self.parse_date(track.file_last_modification_date)  # noqa
                entity.add('modifiedAt', modified_at)
                if track.sampling_rate:
                    entity.add('samplingRate', track.sampling_rate)
                entity.add('duration', track.duration)
        except Exception as ex:
            raise ProcessingException("Could not process audio: %r", ex)

    @classmethod
    def match(cls, file_path, entity):
        score = super(AudioIngestor, cls).match(file_path, entity)
        if score <= 0:
            for mime_type in entity.get('mimeType'):
                if mime_type.startswith('audio/'):
                    return cls.SCORE * 2
        return score
