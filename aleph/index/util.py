import json
from apikit.jsonify import JSONEncoder


def expand_json(data):
    data = JSONEncoder().encode(data)
    return json.loads(data)
