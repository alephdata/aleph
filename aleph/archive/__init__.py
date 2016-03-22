from aleph.archive.file import FileArchive
from aleph.archive.s3 import S3Archive


def from_config(config):
    archive_type = config.get('ARCHIVE_TYPE', 'file').lower()
    if archive_type == 's3':
        return S3Archive(config)
    return FileArchive(config)
