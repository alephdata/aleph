import itertools
from Levenshtein import jaro
from banal import ensure_list
from followthemoney import model
from followthemoney.types import registry
from followthemoney.util import dampen

# OK, Here's the plan: we have to find a way to get user judgements
# on as many of these matches as we can, then build a regression
# model which properly weights the value of a matching property
# based upon it's type.
FP_WEIGHT = 0.6
MATCH_WEIGHTS = {
    registry.text: 0,
    registry.name: 0,  # because we already compare fingerprints
    registry.identifier: 0.4,
    registry.url: 0.1,
    registry.email: 0.3,
    registry.ip: 0.1,
    registry.iban: 0.3,
    registry.address: 0.2,
    registry.date: 0.3,
    registry.phone: 0.1,
    registry.country: 0.1,
    registry.language: 0.1,
}


def compare(left, right):
    """Compare two entities and return number between 0 and 1.
    Returned number indicates probability that two entities are the same.
    """
    left_schema = model.get(left.get('schema'))
    right_schema = model.get(right.get('schema'))
    if right_schema not in list(left_schema.matchable_schemata):
        return 0
    schema = model.precise_schema(left_schema, right_schema)
    score = compare_fingerprints(left, right)
    left_properties = left.get('properties', {})
    right_properties = right.get('properties', {})
    for name, prop in schema.properties.items():
        weight = MATCH_WEIGHTS.get(prop.type, 0)
        if weight == 0:
            continue
        left_values = left_properties.get(name)
        right_values = right_properties.get(name)
        prop_score = prop.type.compare_sets(left_values, right_values)
        score = score + prop_score * weight
    return max(0.0, min(1.0, score)) * 0.9


def compare_fingerprints(left, right):
    result = 0
    left_list = ensure_list(left.get('fingerprints'))
    right_list = ensure_list(right.get('fingerprints'))
    for (left, right) in itertools.product(left_list, right_list):
        similarity = jaro(left, right)
        score = similarity * dampen(3, 20, min(left, right, key=len))
        result = max(result, score)
    return result * FP_WEIGHT
