from aleph.core import db
from aleph.model import Collection, Entity
from aleph.logic import delete_pending
from aleph.tests.factories.models import EntityFactory, CollectionFactory
from aleph.tests.util import TestCase


class EntityModelTest(TestCase):

    def setUp(self):
        super(EntityModelTest, self).setUp()

        self.pending_col = CollectionFactory.create()
        self.col = CollectionFactory.create()
        db.session.flush()

        self.pending_ent = EntityFactory.create(state=Entity.STATE_PENDING)
        self.pending_ent.collections = [self.pending_col]
        self.ent = EntityFactory.create(state=Entity.STATE_ACTIVE)
        self.ent = [self.col]
        db.session.flush()

    def test_delete_pending_entities(self):
        self.assertEqual(Entity.query.count(), 2)
        self.assertEqual(Collection.query.count(), 2)

        delete_pending()

        self.assertEqual(Entity.query.count(), 1)
        self.assertEqual(Collection.query.count(), 2)
