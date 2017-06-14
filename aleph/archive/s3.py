import os
import shutil
import logging
import tempfile

from boto3.session import Session
from botocore.exceptions import ClientError
from ingestors.util import make_filename

from aleph.archive.archive import Archive
from aleph.util import checksum

log = logging.getLogger(__name__)


class S3Archive(Archive):  # pragma: no cover

    def __init__(self, config):
        self.local_base = tempfile.gettempdir()
        self.key_id = config.get('ARCHIVE_AWS_KEY_ID')
        self.secret = config.get('ARCHIVE_AWS_SECRET')
        self.region = config.get('ARCHIVE_AWS_REGION')
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

    def _locate_key(self, content_hash):
        if content_hash is None:
            return
        prefix = self._get_prefix(content_hash)
        if prefix is None:
            return
        for obj in self.bucket.objects.filter(MaxKeys=1, Prefix=prefix):
            return obj

    def archive_file(self, file_path, content_hash=None):
        if content_hash is None:
            content_hash = checksum(file_path)

        obj = self._locate_key(content_hash)
        if obj is None:
            path = os.path.join(self._get_prefix(content_hash), 'data')
            self.bucket.upload_file(file_path, path)

        return content_hash

    def _get_local_prefix(self, content_hash):
        return os.path.join(self.local_base, content_hash)

    def load_file(self, content_hash, file_name=None):
        obj = self._locate_key(content_hash)
        if obj is not None:
            path = self._get_local_prefix(content_hash)
            try:
                os.makedirs(path)
            except:
                pass
            file_name = make_filename(file_name, default='data')
            path = os.path.join(path, file_name)
            self.bucket.download_file(obj.key, path)
            return path

    def cleanup_file(self, content_hash):
        """Delete the local cached version of the file."""
        if content_hash is None:
            return
        path = self._get_local_prefix(content_hash)
        if os.path.isdir(path):
            shutil.rmtree(path)

    def generate_url(self, content_hash, file_name=None, mime_type=None):
        obj = self._locate_key(content_hash)
        if obj is None:
            return
        params = {
            'Bucket': self.bucket_name,
            'Key': obj.key
        }
        if mime_type:
            params['ResponseContentType'] = mime_type
        if file_name:
            disposition = 'inline; filename=%s' % file_name
            params['ResponseContentDisposition'] = disposition
        return self.client.generate_presigned_url('get_object',
                                                  Params=params,
                                                  ExpiresIn=86400)
