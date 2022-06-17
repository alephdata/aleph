# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

from banal import is_mapping, is_listish


def to_jsonschema(obj):
    """Schema are stored in OpenAPI spec and might need some massaging
    to make for valid JSON Schema."""
    if is_mapping(obj):
        # Re-write nullable fields:
        type_ = obj.get("type")

        if obj.get("nullable", False):
            type_ = obj.pop("type", None)
            format_ = obj.pop("format", None)
            obj["oneOf"] = [
                {"type": "null"},
                {"type": type_, "format": format_},
            ]

        obj.pop("nullable", None)
        out = {}
        for key, value in obj.items():
            out[key] = to_jsonschema(value)
        return out
    if is_listish(obj):
        return [to_jsonschema(o) for o in obj]
    return obj
