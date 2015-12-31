import os
import json
import logging
import tempfile
import requests

from aleph.archive.archive import Archive

log = logging.getLogger(__name__)
AUTHZ_URL = 'https://api.backblaze.com/b2api/v1/b2_authorize_account'

# https://github.com/mtingers/backblaze-b2/blob/master/backblazeb2.py
# https://www.backblaze.com/b2/docs/


class B2Archive(Archive):

    def __init__(self, config):
        self.local_base = tempfile.gettempdir()
        self.account_id = config.get('ARCHIVE_B2_ACCOUNT_ID')
        self.account_key = config.get('ARCHIVE_B2_KEY')
        self.bucket_name = config.get('ARCHIVE_BUCKET')
        self.bucket_id = None
        self._auth = None
        log.info("Using archive: b2://%s", self.bucket_name)

        res = requests.post('%s/b2api/v1/b2_list_buckets' % self.api_url,
                            data=json.dumps({'accountId': self.account_id}),
                            headers={'Authorization': self.auth_token})
        if res.status_code != 200:
            raise ValueError(res.json())
        for bucket in res.json().get('buckets'):
            if bucket.get('bucketName') == self.bucket_name:
                self.bucket_id = bucket.get('bucketId')
        if self.bucket_id is None:
            raise ValueError('Could not find B2 bucket: %r' % self.bucket_name)

    @property
    def auth(self):
        if self._auth is None:
            authz = '%s:%s' % (self.account_id, self.account_key)
            authz = authz.encode('base64').strip()
            headers = {'Authorization': 'Basic %s' % authz}
            res = requests.get(AUTHZ_URL, headers=headers)
            self._auth = res.json()
        return self._auth

    @property
    def api_url(self):
        return self.auth.get('apiUrl')

    @property
    def download_url(self):
        return self.auth.get('downloadUrl')

    @property
    def auth_token(self):
        return self.auth.get('authorizationToken')

    def _get_file_id(self, path):
        res = requests.post('%s/b2api/v1/b2_list_file_names' % self.api_url,
                            data=json.dumps({'bucketId': self.bucket_id,
                                             'startFileName': path,
                                             'maxFileCount': 1}),
                            headers={'Authorization': self.auth_token})
        for filedata in res.json().get('files', []):
            if filedata.get('fileName') == path:
                return filedata.get('fileId')

    def upload_credentials(self):
        res = requests.post('%s/b2api/v1/b2_get_upload_url' % self.api_url,
                            data=json.dumps({'bucketId': self.bucket_id}),
                            headers={'Authorization': self.auth_token})
        return (res.json().get('uploadUrl'),
                res.json().get('authorizationToken'))

    def archive_file(self, filename, meta, move=False):
        meta = self._update_metadata(filename, meta)
        path = self._get_file_path(meta)
        if self._get_file_id(path) is None:
            url, token = self.upload_credentials()
            headers = {
                'Authorization': token,
                'X-Bz-File-Name': path,
                'Content-Type': meta.mime_type or 'application/octet-stream',
                'X-Bz-Content-Sha1': meta.content_hash
            }
            with open(filename, 'rb') as fh:
                res = requests.post(url,
                                    data=fh.read(),
                                    headers=headers)
                if res.status_code > 299:
                    raise RuntimeError('Failed to upload: %r' % res.json())

        if move:  # really?
            os.unlink(filename)
        return meta

    def _get_local_mirror(self, meta):
        base = self._get_file_path(meta).split(os.path.sep)
        file_name = '%s-%s' % (base[-2], base[-1])
        return os.path.join(self.local_base, file_name)

    def load_file(self, meta):
        path = self._get_local_mirror(meta)
        key = self._get_file_path(meta)
        url = '%s/file/%s/%s' % (self.download_url, self.bucket_name, key)
        res = requests.get(url, stream=True,
                           headers={'Authorization': self.auth_token})
        if res.status_code < 300:
            with open(path, 'wb') as fh:
                for chunk in res:
                    fh.write(chunk)
        return path

    def cleanup_file(self, meta):
        path = self._get_local_mirror(meta)
        if os.path.isfile(path):
            os.unlink(path)
