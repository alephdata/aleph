from aleph.archive.file import FileArchive
from aleph.archive.s3 import S3Archive
from aleph.archive.b2 import B2Archive


def from_config(config):
    archive_type = config.get('ARCHIVE_TYPE', 'file').lower()
    if archive_type == 's3':
        return S3Archive(config)
    if archive_type == 'b2':
        return B2Archive(config)
    return FileArchive(config)
