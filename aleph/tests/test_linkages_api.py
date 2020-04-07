from aleph.core import db
from aleph.model import Linkage
from aleph.model.common import make_textid
from aleph.tests.util import TestCase


class LinkagesApiTestCase(TestCase):

    def setUp(self):
        super(LinkagesApiTestCase, self).setUp()
        self.user = self.create_user()
        self.group = self.create_group('group', self.user)

    def test_index_anonymous(self):
        res = self.client.get('/api/2/linkages')
        assert res.status_code == 403, res.json

    def test_linkage_index(self):
        role, headers = self.login()
        other, _ = self.login(foreign_id='other')
        profile_id = make_textid()
        coll = self.create_collection()
        self.grant_publish(coll)
        Linkage.save(profile_id, make_textid(), coll.id, role.id,
                     decision=True, decider_id=role.id)
        Linkage.save(profile_id, make_textid(), coll.id, self.group.id,
                     decision=True, decider_id=role.id)
        Linkage.save(profile_id, make_textid(), coll.id, other.id,
                     decision=True, decider_id=other.id)
        db.session.commit()

        res = self.client.get('/api/2/linkages', headers=headers)
        assert res.json['total'] == 2, res.json

        url = '/api/2/linkages?filter:context_id=%s' % role.id
        res = self.client.get(url, headers=headers)
        assert res.json['total'] == 1, res.json
