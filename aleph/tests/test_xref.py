import json
from unittest import skip  # noqa

from aleph.core import db
from aleph.tests.util import TestCase
from aleph.logic.xref import xref_collection
from aleph.model import Match


class XrefTestCase(TestCase):

    def setUp(self):
        super(XrefTestCase, self).setUp()
        self.user = self.create_user()
        self.coll_a = self.create_collection(creator=self.user, casefile=False)
        self.coll_b = self.create_collection(creator=self.user, casefile=False)
        self.coll_c = self.create_collection(creator=self.user, casefile=False)
        db.session.commit()

    def test_xref(self):
        _, headers = self.login(foreign_id=self.user.foreign_id)
        url = '/api/2/entities'

        entity = {
            'schema': 'Person',
            'name': 'Carlos Danger',
            'collection_id': self.coll_a.id,
            'properties': {
                'nationality': 'US'
            }
        }
        self.client.post(url, data=json.dumps(entity),
                         headers=headers,
                         content_type='application/json')
        entity = {
            'schema': 'Person',
            'name': 'Carlos Danger',
            'collection_id': self.coll_b.id,
            'properties': {
                'nationality': 'US'
            }
        }
        self.client.post(url, data=json.dumps(entity),
                         headers=headers,
                         content_type='application/json')
        entity = {
            'schema': 'LegalEntity',
            'name': 'Carlos Danger',
            'collection_id': self.coll_b.id,
            'properties': {
                'nationality': 'GB'
            }
        }
        self.client.post(url, data=json.dumps(entity),
                         headers=headers,
                         content_type='application/json')
        entity = {
            'schema': 'Person',
            'name': 'Pure Risk',
            'collection_id': self.coll_b.id,
            'properties': {
                'nationality': 'US'
            }
        }
        self.client.post(url, data=json.dumps(entity),
                         headers=headers,
                         content_type='application/json')

        q = db.session.query(Match)
        assert 0 == q.count(), q.count()

        self.flush_index()
        xref_collection(self.coll_a.id)

        q = db.session.query(Match)
        assert 2 == q.count(), q.count()

    def test_xref_collection(self):
        _, headers = self.login(foreign_id=self.user.foreign_id)
        url = '/api/2/entities'

        entity = {
            'schema': 'Person',
            'name': 'Carlos Danger',
            'collection_id': self.coll_a.id,
            'properties': {
                'nationality': 'US'
            }
        }
        self.client.post(url, data=json.dumps(entity),
                         headers=headers,
                         content_type='application/json')
        entity = {
            'schema': 'Person',
            'name': 'Carlos Danger',
            'collection_id': self.coll_b.id,
            'properties': {
                'nationality': 'US'
            }
        }
        self.client.post(url, data=json.dumps(entity),
                         headers=headers,
                         content_type='application/json')
        entity = {
            'schema': 'LegalEntity',
            'name': 'Carlos Danger',
            'collection_id': self.coll_b.id,
            'properties': {
                'nationality': 'GB'
            }
        }
        self.client.post(url, data=json.dumps(entity),
                         headers=headers,
                         content_type='application/json')
        entity = {
            'schema': 'Person',
            'name': 'Pure Risk',
            'collection_id': self.coll_b.id,
            'properties': {
                'nationality': 'US'
            }
        }
        self.client.post(url, data=json.dumps(entity),
                         headers=headers,
                         content_type='application/json')

        entity = {
            'schema': 'LegalEntity',
            'name': 'Carlof Danger',
            'collection_id': self.coll_c.id,
            'properties': {
                'nationality': 'FR'
            }
        }
        self.client.post(url, data=json.dumps(entity),
                         headers=headers,
                         content_type='application/json')
        entity = {
            'schema': 'Person',
            'name': 'Dorian Gray',
            'collection_id': self.coll_c.id,
            'properties': {
                'nationality': 'GB'
            }
        }
        self.client.post(url, data=json.dumps(entity),
                         headers=headers,
                         content_type='application/json')

        q = db.session.query(Match)
        assert 0 == q.count(), q.count()

        self.flush_index()
        xref_collection(self.coll_a.id, self.coll_c.id)

        q = db.session.query(Match)
        assert 1 == q.count(), q.count()

        # TODO: check match is only from collC not collB
