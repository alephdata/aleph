import json
from StringIO import StringIO

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
        db.session.flush()
        db.session.commit()
        self.url = '/api/1/collections/%s/ingest' % self.col.id
        self.meta = {
            'countries': ['de', 'us'],
            'languages': ['en']
        }

    def test_upload_logged_out(self):
        data = {'meta': json.dumps(self.meta)}
        res = self.client.post(self.url, data=data)
        assert res.status_code == 403, res

    def test_upload_no_meta(self):
        self.login(is_admin=True)
        data = {'meta': 'hihi'}
        res = self.client.post(self.url, data=data)
        assert res.status_code == 400, res

    def test_upload_html_doc(self):
        self.login(is_admin=True)
        data = {
            'meta': json.dumps(self.meta),
            'foo': (StringIO("this is a futz with a banana"), 'futz.html')
        }
        res = self.client.post(self.url, data=data)
        assert res.status_code == 200, res
        metas = res.json['metadata']
        assert len(metas) == 1, metas
        assert metas[0]['file_name'] == 'futz.html', metas
