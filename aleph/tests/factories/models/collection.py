import factory

from aleph.core import db
from aleph.model import Collection


class CollectionFactory(factory.alchemy.SQLAlchemyModelFactory):

    class Meta:
        model = Collection
        sqlalchemy_session = db.session

    foreign_id = factory.Faker('uuid4')
    label = factory.Faker('company')
    countries = factory.Sequence(
        lambda n: [factory.Faker('country_code').generate({})])
