import factory

from aleph.core import db
from aleph.model import Entity
from aleph.analyze.polyglot_entity import SCHEMAS


class EntityFactory(factory.alchemy.SQLAlchemyModelFactory):

    class Meta:
        # Attributes like `type`/`$schema` make it complicated to use the model
        model = dict
        sqlalchemy_session = db.session

    name = factory.Faker('name')
    jurisdiction_code = factory.Faker('country_code')
    summary = factory.Faker('sentence')
    type = factory.Faker('random_element', elements=SCHEMAS.values())
    identifiers = factory.Sequence(lambda n: [{
        'scheme': factory.Faker(
            'random_element', elements=['wikipedia', 'google']).generate({}),
        'identifiers': 'en:' + factory.Faker(
            'name').generate({}).replace(' ', '-')
    }])
    other_names = factory.Sequence(lambda n: [{
        'name': factory.Faker('name').generate({}),
    }])
