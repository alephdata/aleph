import os
import six
import logging
import tempfile

from boto3.session import Session
from botocore.exceptions import ClientError

from aleph.archive.archive import Archive
from aleph.util import make_filename

log = logging.getLogger(__name__)


class S3Archive(Archive):  # pragma: no cover

    def __init__(self, config):
        self.local_base = six.text_type(tempfile.gettempdir())
        self.key_id = config.get('ARCHIVE_AWS_KEY_ID')
        self.secret = config.get('ARCHIVE_AWS_SECRET')
        self.region = config.get('ARCHIVE_AWS_REGION', 'eu-west-1')
        self.bucket_name = config.get('ARCHIVE_BUCKET')

        self.session = Session(aws_access_key_id=self.key_id,
                               aws_secret_access_key=self.secret,
                               region_name=self.region)
        self.s3 = self.session.resource('s3')
        self.client = self.session.client('s3')
        log.info("Using archive: s3://%s", self.bucket_name)
        self.bucket = self.s3.Bucket(self.bucket_name)

        try:
            self.bucket.load()
        except ClientError as e:
            error_code = int(e.response['Error']['Code'])
            if error_code == 404:
                self.bucket.create(CreateBucketConfiguration={
                    'LocationConstraint': self.region
                })
            else:
                raise

    def upgrade(self):
        """Make sure bucket policy is set correctly."""
        cors = self.bucket.Cors()
        config = {
            'CORSRules': [
                {
                    'AllowedMethods': ['GET'],
                    'AllowedOrigins': ['*'],
                    'AllowedHeaders': ['*'],
                    'ExposeHeaders': ['Accept-Ranges', 'Content-Encoding',
                                      'Content-Length', 'Content-Range'],
                    'MaxAgeSeconds': 84600 * 14
                }
            ]
        }
        cors.put(CORSConfiguration=config)

    def _locate_key(self, meta):
        key = self._get_file_path(meta)
        prefix = os.path.dirname(key)
        for obj in self.bucket.objects.filter(MaxKeys=1, Prefix=prefix):
            return obj

    def archive_file(self, filename, meta, move=False):
        meta = self._update_metadata(filename, meta)
        path = self._get_file_path(meta)
        obj = self._locate_key(meta)
        if obj is None:
            self.bucket.upload_file(filename, path)

        if move:  # really?
            os.unlink(filename)
        return meta

    def _get_local_mirror(self, meta):
        base = self._get_file_path(meta).split(os.path.sep)
        file_name = '-'.join((base[-2], base[-1]))
        return os.path.join(self.local_base, make_filename(file_name))

    def load_file(self, meta):
        path = self._get_local_mirror(meta)
        obj = self._locate_key(meta)
        if obj is not None:
            self.bucket.download_file(obj.key, path)
            return path

    def cleanup_file(self, meta):
        path = self._get_local_mirror(meta)
        if os.path.isfile(path):
            os.unlink(path)

    def generate_url(self, meta):
        obj = self._locate_key(meta)
        if obj is None:
            return
        params = {
            'Bucket': self.bucket_name,
            'Key': obj.key
        }
        if meta.mime_type:
            params['ResponseContentType'] = meta.mime_type
        if meta.file_name:
            disposition = 'inline; filename=%s' % meta.file_name
            params['ResponseContentDisposition'] = disposition
        return self.client.generate_presigned_url('get_object',
                                                  Params=params,
                                                  ExpiresIn=86400)
