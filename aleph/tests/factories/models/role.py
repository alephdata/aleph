# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
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
