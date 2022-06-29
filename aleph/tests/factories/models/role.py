# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

import factory

from aleph.core import db
from aleph.model import Role


class RoleFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Role
        sqlalchemy_session = db.session

    type = Role.USER
    name = factory.Faker("name")
    email = factory.Faker("email")
    api_key = factory.Faker("uuid4")
    foreign_id = factory.Faker("uuid4")
