from aleph.core import db
from aleph.model import Entity
from aleph.tests.util import TestCase


class StreamApiTestCase(TestCase):

    def setUp(self):
        super(StreamApiTestCase, self).setUp()

    def test_entities(self):
        self.load_fixtures('docs.yaml')
        res = self.client.get('/api/2/entities/_stream')
        assert res.status_code == 403, res

        _, headers = self.login(is_admin=True)
        res = self.client.get('/api/2/entities/_stream', headers=headers)
        assert res.status_code == 200, res
        lines = len(res.data.split(b'\n'))
        assert 19 == lines, lines

    def test_rdf(self):
        coll = self.create_collection(
            label='Test Collection',
            foreign_id='test_coll_stream_api'
        )
        ent = Entity.create({
            'schema': 'Person',
            'properties': {
                'name': 'Winnie the Pooh',
            }
        }, coll)
        db.session.add(ent)
        db.session.commit()

        url = '/api/2/collections/%s/_rdf' % coll.id
        res = self.client.get(url)
        assert res.status_code == 403, res
        _, headers = self.login(is_admin=True)
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
