import factory

from aleph.core import db
from aleph.model import Credential

from .role import RoleFactory


class CredentialFactory(factory.alchemy.SQLAlchemyModelFactory):

    class Meta:
        model = Credential
        sqlalchemy_session = db.session

    reset_token = factory.Sequence(
        lambda n: factory.Faker('uuid4').generate({}).replace('-', ''))

    source = factory.Iterator(Credential.SOURCES)
    foreign_id = factory.Faker('md5')
    secret = factory.Faker('md5')
    role = factory.SubFactory(RoleFactory)
