import logging

from ingestors.ingestor import Ingestor

log = logging.getLogger(__name__)


class IgnoreIngestor(Ingestor):
    MIME_TYPES = [
        'application/x-pkcs7-mime',
        'application/pkcs7-mime',
        'application/pkcs7-signature',
        'application/x-pkcs7-signature',
        'application/x-pkcs12'
        'application/pgp-encrypted',
        'application/x-shockwave-flash',
        'application/vnd.apple.pkpass',
        'application/x-executable',
        'application/x-mach-binary',
        'application/x-sharedlib',
        'application/x-dosexec',
        'application/x-java-keystore',
        'application/java-archive',
        'application/font-sfnt',
        'application/vnd.ms-office.vbaproject',
        'application/x-x509-ca-cert',
        'text/calendar',
        'text/css',
        'application/vnd.ms-opentype',
        'application/x-font-ttf',
    ]
    EXTENSIONS = [
        'json',
        'exe',
        'dll',
        'ini',
        'class',
        'jar',
        'psd',  # adobe photoshop
        'indd',  # adobe indesign
        'sql',
        'dat',
        'log',
        'pbl',
        'p7m',
        'plist',
        'ics',
        'axd'
    ]
    NAMES = [
        '.DS_Store',
        'Thumbs.db',
        '.gitignore'
    ]
    SCORE = 2

    def ingest(self, file_path, entity):
        log.info("[%r] will be ignored but stored.", entity)

    @classmethod
    def match(cls, file_path, entity):
        for file_size in entity.get('fileSize'):
            if int(file_size) == 0:
                return cls.SCORE * 100
        for file_name in entity.get('fileName'):
            if file_name in cls.NAMES:
                return cls.SCORE
        return super(IgnoreIngestor, cls).match(file_path, entity)
