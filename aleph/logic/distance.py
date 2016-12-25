from itertools import product
from Levenshtein import jaro_winkler
from pprint import pprint  # noqa

SUPER_SCIENTIFIC_WEIGHTINGS = {
    'names': 0.3,
    'fp_distance': 0.3,
    'fp_tokens': 0.2,
    'countries': 0.1,
    'dates': 0.1,
    'addresses_distance': 0.1,
    'addresses_tokens': 0.1,
    'emails': 0.3,
    'phones': 0.3,
    'identifiers': 0.4,
}


def pred_best_jw(a, b, field):
    """Find the closest jaro-winkler match."""
    best = float()
    for (ak, bk) in product(a.get(field, []), b.get(field, [])):
        best = max(best, jaro_winkler(ak.lower(), bk.lower()))
    return best


def pred_matching_elem(a, b, field):
    """Find the closest jaro-winkler match."""
    for (ak, bk) in product(a.get(field, []), b.get(field, [])):
        if ak.lower() == bk.lower():
            return 1.0
    return 0.0


def pred_token_overlap(a, b, field):
    """Find the closest jaro-winkler match."""
    best = float()
    a = [set(n.split()) for n in a.get(field, [])]
    b = [set(n.split()) for n in b.get(field, [])]
    for (ak, bk) in product(a, b):
        overlap = float(len(ak.intersection(bk)))
        overlap = overlap / float(max(len(ak), len(bk)))
        best = max(overlap, best)
    return best


def entity_distance(entity, other):
    # once we have enough training data, this should use a regression model
    # of some sort to calculate a multi-attribute based similarity metric.
    # cf. https://github.com/datamade/rlr
    # http://scikit-learn.org/stable/auto_examples/linear_model/plot_ols.html
    if 'names' not in other:
        other['names'] = [other['name']]
    features = {
        'names': pred_best_jw(entity, other, 'names'),
        'fp_distance': pred_best_jw(entity, other, 'fingerprints'),
        'fp_tokens': pred_token_overlap(entity, other, 'fingerprints'),
        'countries': pred_best_jw(entity, other, 'countries'),
        'addresses_distance': pred_best_jw(entity, other, 'addresses'),
        'addresses_tokens': pred_token_overlap(entity, other, 'addresses'),
        'emails': pred_best_jw(entity, other, 'emails'),
        'phones': pred_best_jw(entity, other, 'phones'),
        'identifiers': pred_best_jw(entity, other, 'identifiers'),
    }
    # pprint(features)
    score = float()
    for field, value in features.items():
        score += value * SUPER_SCIENTIFIC_WEIGHTINGS[field]
    return min(1.0, score)
