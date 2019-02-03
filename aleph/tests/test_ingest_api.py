import json
from io import BytesIO

from aleph.core import db
from aleph.model import Collection
from aleph.tests.util import TestCase


class IngestApiTestCase(TestCase):

    def setUp(self):
        super(IngestApiTestCase, self).setUp()
        self.rolex = self.create_user(foreign_id='user_3')
        self.col = Collection()
        self.col.label = 'Test Collection'
        self.col.foreign_id = 'test_coll_entities_api'
        db.session.add(self.col)
        db.session.commit()
        self.url = '/api/2/collections/%s/ingest' % self.col.id
        self.csv_path = self.get_fixture_path('experts.csv')

    def test_upload_logged_out(self):
        data = {'meta': json.dumps({})}
        res = self.client.post(self.url,
                               data=data)
        assert res.status_code == 403, res

    def test_upload_no_meta(self):
        _, headers = self.login(is_admin=True)
        data = {'meta': 'hihi'}
        res = self.client.post(self.url,
                               data=data,
                               headers=headers)
        assert res.status_code == 400, res

    def test_upload_csv_doc(self):
        self.flush_index()
        _, headers = self.login(is_admin=True)
        meta = {
            'countries': ['de', 'us'],
            'languages': ['en'],
            'mime_type': 'text/csv',
            'source_url': 'http://pudo.org/experts.csv'
        }
        data = {
            'meta': json.dumps(meta),
            'foo': open(self.csv_path, 'rb'),
        }
        res = self.client.post(self.url,
                               data=data,
                               headers=headers)
        assert res.status_code == 200, (res, res.data)
        docs = res.json['documents']
        assert len(docs) == 1, docs
        assert docs[0]['file_name'] == 'experts.csv', docs
        self.flush_index()

        res = self.client.get('/api/2/entities',
                              headers=headers)
        assert res.json['total'] == 1, res.json
        res = self.client.get('/api/2/entities/1', headers=headers)
        assert 'de' in res.json['countries'], res.json
        assert 'us' in res.json['countries'], res.json
        res = self.client.get('/api/2/documents/1/file',
                              headers=headers)
        assert b'Klaus Trutzel' in res.data
        assert 'text/csv' in res.content_type, res.content_type

    def test_upload_html_doc(self):
        html_path = self.get_fixture_path('samples/website.html')
        _, headers = self.login(is_admin=True)
        meta = {
            'countries': ['ru', 'us'],
            'languages': ['en'],
            'source_url': 'https://en.wikipedia.org/wiki/How_does_one_patch_KDE2_under_FreeBSD%3F'  # noqa
        }
        data = {
            'meta': json.dumps(meta),
            'foo': open(html_path, 'rb')
        }
        res = self.client.post(self.url,
                               data=data,
                               headers=headers)
        assert res.status_code == 200, (res, res.data)
        docs = res.json['documents']
        assert len(docs) == 1, docs
        assert docs[0]['schema'] == 'HyperText', docs
        self.flush_index()

        res = self.client.get('/api/2/entities', headers=headers)
        assert res.json['total'] == 1, res.json

        res = self.client.get('/api/2/documents/1/content',
                              headers=headers)
        # assert 'us' in res.json['countries'], res.json
        assert 'html' in res.json, res.json
        assert 'Wikipedia, the free encyclopedia' in res.json['html'], \
            res.json['html']

        res = self.client.get('/api/2/documents/1/file',
                              headers=headers)
        assert b'KDE2' in res.data
        assert 'text/html' in res.content_type, res.content_type

    def test_invalid_meta(self):
        _, headers = self.login(is_admin=True)
        meta = {'title': 3, 'file_name': ''}
        data = {
            'meta': json.dumps(meta),
            'foo': (BytesIO(b"this is a futz with a banana"), 'futz.html')
        }
        res = self.client.post(self.url,
                               data=data,
                               headers=headers)
        assert res.status_code == 400, res

    def test_invalid_ambiguous_file_foreign_id(self):
        _, headers = self.login(is_admin=True)
        meta = {'title': 'test', 'foreign_id': 'test'}
        data = {
            'meta': json.dumps(meta),
            'foo': (BytesIO(b"this is a futz with a banana"), 'futz.html'),
            'bar': (BytesIO(b"this is a shmoo with a banana"), 'bar.html'),
            'quix': (BytesIO(b"this is a lala with a banana"), 'qux.html')
        }
        res = self.client.post(self.url,
                               data=data,
                               headers=headers)
        assert res.status_code == 400, res

    def test_invalid_directory_without_foreign_id(self):
        _, headers = self.login(is_admin=True)
        meta = {'title': 'test'}
        data = {'meta': json.dumps(meta)}
        res = self.client.post(self.url,
                               data=data,
                               headers=headers)
        assert res.status_code == 400, res

    def test_directory_with_file(self):
        _, headers = self.login(is_admin=True)
        meta = {
            'file_name': 'directory',
            'foreign_id': 'directory',
            'schema': 'Folder'
        }
        data = {'meta': json.dumps(meta)}
        res = self.client.post(self.url,
                               data=data,
                               headers=headers)
        assert res.status_code == 200, res
        assert len(res.json['documents']) == 1, res.json
        directory = res.json['documents'][0]
        assert directory['schema'] == 'Folder', res.json
        assert directory['status'] == 'success', res.json

        meta = {
            'file_name': 'subdirectory',
            'foreign_id': 'subdirectory',
            'parent': {'foreign_id': 'directory'}
        }
        data = {'meta': json.dumps(meta)}
        res = self.client.post(self.url,
                               data=data,
                               headers=headers)
        assert res.status_code == 200, res
        assert len(res.json['documents']) == 1, res.json
        subdirectory = res.json['documents'][0]
        assert 'parent' in subdirectory, subdirectory
        parent = subdirectory['parent']
        assert parent['id'] == directory['id'], parent
