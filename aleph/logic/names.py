import math
import logging
from functools import reduce
from banal import ensure_list
from normality import normalize
from elasticsearch.helpers import scan

from aleph.core import es, kv
from aleph.model import Entity
from aleph.index.indexes import entities_read_index

log = logging.getLogger(__name__)
TOKEN_KEY = 'namefreq:tokens'
TOTAL_KEY = 'namefreq:total'
MAX_KEY = 'namefreq:max'


def name_tokens(name):
    name = normalize(name, ascii=True)
    if name is None:
        return []
    return [n for n in name.split(' ') if len(n) > 1]


def iter_tokens(limit=1000000000):
    """Go through all the names in the index."""
    query = {'_source': {'include': 'names'}}
    index = entities_read_index(schema=Entity.LEGAL_ENTITY)
    seen = 0
    try:
        for res in scan(es, index=index, query=query, scroll='1440m'):
            names = ensure_list(res.get('_source', {}).get('names'))
            tokens = set()
            for name in names:
                tokens.update(name_tokens(name))
            yield from tokens

            seen += 1
            if seen % 1000 == 0:
                log.info("Entities: %s", seen)
            if limit is not None and seen > limit:
                return
    except Exception as ex:
        log.warning("Token iterator aborted: %s", ex)


def compute_name_frequencies():
    """Compute a numeric distribution of name frequencies."""
    # Count how often each name part (i.e. token) shows up across
    # the whole of the dataset or a sample.
    pipe = kv.pipeline(transaction=False)
    pipe.delete(TOKEN_KEY)
    names_count = 0
    for idx, token in enumerate(iter_tokens()):
        pipe.hincrby(TOKEN_KEY, token, 1)
        names_count += 1
        if idx > 0 and idx % 10000 == 0:
            pipe.execute()
            pipe = kv.pipeline(transaction=False)
    pipe.execute()
    log.info("Names: %d", names_count)

    total = 0
    distinct = 0
    max_count = 0
    for name, count in kv.hscan_iter(TOKEN_KEY):
        count = int(count)
        if count == 1:
            continue
        distinct += 1
        total += count
        max_count = max((count, max_count))

    log.info("Total: %d, distinct: %d, max: %d", total, distinct, max_count)
    pipe.set(MAX_KEY, max_count)
    pipe.set(TOTAL_KEY, total)
    pipe.execute()


def name_frequency(name):
    # TODO: maybe we can normalise this over the number of
    # characters in the string such that it biases towards
    # longer names with rare name parts.
    total, max_count = kv.mget(TOTAL_KEY, MAX_KEY)
    if total is None:
        return 1
    total = float(total)
    max_count = float(max_count or 2)
    max_prob = max_count / total
    min_prob = math.pow(1 / total, 2)
    tokens = name_tokens(name)
    if not len(tokens):
        return 0
    counts = kv.hmget(TOKEN_KEY, tokens)
    counts = [int(c or 1) for c in counts]
    probabilities = [count/total for count in counts]
    product = reduce(lambda x, y: x*y, probabilities)
    product = max((product, min_prob))
    norm = (math.log(max_prob) - math.log(min_prob))
    score = (math.log(max_prob) - math.log(product)) / norm
    print(name, counts, score)
    return score
