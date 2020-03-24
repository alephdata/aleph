from aleph.core import db
from aleph.model import Linkage
from aleph.model.common import make_textid
from aleph.tests.util import TestCase


class LinkageApiTestCase(TestCase):

    def setUp(self):
        super(LinkageApiTestCase, self).setUp()

    def test_index_anonymous(self):
        res = self.client.get('/api/2/linkages')
        assert res.status_code == 403, res.json

    def test_linkage_index(self):
        role, headers = self.login()
        other, _ = self.login(foreign_id='other')
        profile_id = make_textid()
        coll = self.create_collection()
        Linkage.save(profile_id, make_textid(), coll.id, role.id,
                     decision=True, decider_id=role.id)
        Linkage.save(profile_id, make_textid(), coll.id, other.id,
                     decision=True, decider_id=other.id)
        db.session.commit()

        res = self.client.get('/api/2/linkages', headers=headers)
        assert res.json['total'] == 1, res.json
