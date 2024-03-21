import json
import os
from json.decoder import JSONDecodeError
from aleph.settings import Settings
from unittest.mock import patch


STRING_PREFIX = "FOO_"
JSON_PREFIX = "BAR_"


def test_string_prefix() -> None:
    setting_name = "SOMETHING"
    env_var = STRING_PREFIX + setting_name
    value = "abc"
    with patch.dict(
        os.environ, {"ALEPH_STRING_CONFIG_PREFIX": STRING_PREFIX, env_var: value}
    ):
        settings = Settings()
    assert getattr(settings, setting_name) == value
    assert not hasattr(settings, env_var)
    assert not hasattr(settings, "ALEPH_STRING_CONFIG_PREFIX")


def test_json_prefix() -> None:
    setting_name = "SOMETHING"
    env_var = JSON_PREFIX + setting_name
    value = 123
    with patch.dict(
        os.environ, {"ALEPH_JSON_CONFIG_PREFIX": JSON_PREFIX, env_var: str(value)}
    ):
        settings = Settings()
    assert getattr(settings, setting_name) == value
    assert not hasattr(settings, env_var)
    assert not hasattr(settings, "ALEPH_JSON_CONFIG_PREFIX")


def test_illegal_json_prefix() -> None:
    setting_name = "SOMETHING"
    env_var = JSON_PREFIX + setting_name
    value = "i am a plain string, not a double quoted JSON string"
    with patch.dict(
        os.environ, {"ALEPH_JSON_CONFIG_PREFIX": JSON_PREFIX, env_var: str(value)}
    ):
        try:
            Settings()
        except JSONDecodeError:
            pass
        else:
            raise Exception("Expected JSONDecodeError, but none was raised")


def test_json_prefix_to_dict() -> None:
    setting_name = "SOMETHING"
    env_var = JSON_PREFIX + setting_name
    config_object = {"my_setting": "some_value"}
    value = json.dumps(config_object)
    with patch.dict(
        os.environ, {"ALEPH_JSON_CONFIG_PREFIX": JSON_PREFIX, env_var: str(value)}
    ):
        settings = Settings()
    assert getattr(settings, setting_name) == config_object
