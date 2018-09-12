import jellyfish
import itertools
from banal import ensure_list
from followthemoney import model


def compare(left, right):
    """Compare two entities and return number between 0 and 1.
    Returned number indicates probability that two entities are the same.
    """
    left_schema = model.get(left.get('schema'))
    right_schema = model.get(right.get('schema'))
    if right_schema not in list(left_schema.matchable_schemata):
        return 0

    name_result = compare_fingerprints(left, right)
    identifiers_result = compare_identifiers(left, right)
    result = (name_result + identifiers_result)/2
    return max(0.0, min(1.0, result))


def compare_fingerprints(left, right):
    result = 0
    results = []

    left_list = ensure_list(left.get('fingerprints'))
    right_list = ensure_list(right.get('fingerprints'))

    if left_list and right_list:
        for (left, right) in itertools.product(left_list, right_list):
            results.append(jellyfish.jaro_distance(left, right))

        result = max(results)
        for res in results:
            if res == 1:
                result += 0.2
            elif res > 0.8:
                result += 0.1
    return result


def compare_identifiers(left, right):
    result = 0
    left_list = ensure_list(left.get('identifiers'))
    right_list = ensure_list(right.get('identifiers'))

    left_list = extract_ids(left_list)
    right_list = extract_ids(right_list)

    if left_list and right_list:
        comp = set.intersection(left_list, right_list)
        result = len(comp)

    return result


def extract_ids(id_strings):
    """For now extracts only numbers, TODO: add other specific identifiers"""
    return set(filter(None, [extract_id(i) for i in id_strings]))


def extract_id(id_string):
    """Get one word from string with most numbers and longer than
    3 characters"""
    best_id_candidate = None
    numbers_in_id = 0
    id_list = [i for i in id_string.split() if len(i) > 3]
    for word in id_list:
        numbers = sum(symbol.isdigit() for symbol in word)
        if numbers_in_id < numbers:
            numbers_in_id = numbers
            best_id_candidate = word
    return best_id_candidate
