import os

from aleph.archive.archive import Archive


class S3Archive(Archive):

    def __init__(self, config):
        aws_key_id = os.environ.get('AWS_ACCESS_KEY_ID')
        aws_secret = os.environ.get('AWS_SECRET_ACCESS_KEY')
        self.aws_key_id = config.get('ARCHIVE_AWS_KEY_ID', aws_key_id)
        self.aws_key_id = config.get('ARCHIVE_AWS_SECRET', aws_secret)
        self.bucket_name = config.get('ARCHIVE_BUCKET')

