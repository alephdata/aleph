from normality import stringify
from flask_babel import gettext
from followthemoney import model
from followthemoney.types import registry
from followthemoney.namespace import Namespace
from jsonschema import FormatChecker

from aleph import settings
from aleph.model import Collection, EntitySet


checker = FormatChecker()


@checker.checks("locale", raises=ValueError)
def check_locale(value):
    value = stringify(value)
    if value not in settings.UI_LANGUAGES:
        raise ValueError(gettext("Invalid user locale."))
    return True


@checker.checks("entity-id", raises=ValueError)
def check_entity_id(value):
    value, _ = Namespace.parse(value)
    if not registry.entity.validate(value):
        msg = gettext("Invalid entity ID: %s")
        raise ValueError(msg % value)
    return True


@checker.checks("category", raises=ValueError)
def check_category(value):
    if value not in Collection.CATEGORIES.keys():
        raise ValueError(gettext("Invalid category."))
    return True


@checker.checks("frequency", raises=ValueError)
def check_frequency(value):
    if value not in Collection.FREQUENCIES.keys():
        raise ValueError(gettext("Invalid frequency."))
    return True


@checker.checks("entitysettype", raises=ValueError)
def check_entitysettype(value):
    if value not in EntitySet.TYPES:
        raise ValueError(gettext("Invalid set type."))
    return True


@checker.checks("ftm-url", raises=ValueError)
def check_url(value):
    if not registry.url.validate(value):
        raise ValueError(gettext("Invalid URL."))
    return True


@checker.checks("ftm-language", raises=ValueError)
def check_language(value):
    value = registry.language.clean(value)
    if not registry.language.validate(value):
        raise ValueError(gettext("Invalid language code."))
    return True


@checker.checks("ftm-country", raises=ValueError)
def check_country_code(value):
    value = registry.country.clean(value)
    if not registry.country.validate(value):
        msg = gettext("Invalid country code: %s")
        raise ValueError(msg % value)
    return True


@checker.checks("schema", raises=ValueError)
def check_schema(value):
    schema = model.get(value)
    if schema is None:
        msg = gettext("Invalid schema name: %s")
        raise ValueError(msg % value)
    return True


@checker.checks("ftm-date", raises=ValueError)
def check_partial_date(value):
    if not registry.date.validate(value):
        raise ValueError(gettext("Invalid date: %s") % value)
    return True
