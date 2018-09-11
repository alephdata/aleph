from followthemoney import model
import jellyfish
from banal import ensure_list

def compare(left, right):
    """Compare two entities and return number between 0 and 1
    
    Returned number indicates probability that two entities are the same.    
    """
    result = 0

    matchable = [s.name for s in model if s.matchable]
    
    if left['schema'] in matchable and right['schema'] in matchable:   
        result = compare_entities(left, right) 
    return result

def compare_entities(left, right):
    name_result = compare_fingerprints(left, right)
    identifiers_result = compare_identifiers(left, right)
    result = (name_result + identifiers_result)/2
    if result > 1:
        result = 1
    return result

def compare_names(left, right):
    result = jellyfish.jaro_distance(left['name'], right['name'])
    return result

def compare_fingerprints(left, right):
    result = jellyfish.jaro_distance(left['fingerprints'][0], right['fingerprints'][0])
    return result

def compare_identifiers(left, right):
    result = 0
   
    try:        
        if left['identifiers'] and right['identifiers']:
            left_list = extract_ids(left['identifiers'])
            right_list = extract_ids(right['identifiers'])
            if left_list and right_list:
                comp = set.intersection(left_list, right_list)
                result = len(comp)
    except KeyError:        
        pass
    
    return result

def extract_ids(id_strings):
    """For now extracts only numbers, TODO: add other specific identifiers"""
    return set(filter(None, [extract_id(i) for i in id_strings]))
    
def extract_id(id_string):
    best_id_candidate = None
    numbers_in_id = 0
    id_list = [i for i in id_string.split() if len(i) > 3]
    for word in id_list:
        numbers = sum(symbol.isdigit() for symbol in word)
        if numbers_in_id < numbers:
            numbers_in_id = numbers
            best_id_candidate = word
    return best_id_candidate