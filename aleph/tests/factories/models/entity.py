# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

import factory

from aleph.core import db
from aleph.model import Entity

SCHEMAS = ["Person", "Company", "Organization"]


class EntityFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Entity
        sqlalchemy_session = db.session

    id = factory.Sequence(
        lambda n: factory.Faker("uuid4").generate({}).replace("-", "")
    )
    name = factory.Faker("name")
    type = factory.Faker("random_element", elements=SCHEMAS)
    data = factory.Sequence(
        lambda n: {
            "summary": factory.Faker("sentence").generate({}),
            "jurisdiction_code": factory.Faker("country_code").generate({}),
            "aliases": [factory.Faker("slug").generate({})],
            "identifiers": [
                {
                    "identifiers": "en:" + factory.Faker("md5").generate({}),
                    "scheme": factory.Faker(
                        "random_element", elements=["wikipedia", "google"]
                    ).generate({}),
                }
            ],
        }
    )
