import logging
from banal import ensure_list
from normality import normalize
from servicelayer.cache import make_key
from elasticsearch.helpers import scan

from aleph.core import es, kv
from aleph.model import Entity
from aleph.index.indexes import entities_read_index

log = logging.getLogger(__name__)
TOKEN_KEY = 'namefreq:tokens'
DIST_KEY = 'namefreq:dist'
TOTAL_KEY = 'namefreq:total'


def name_tokens(name):
    name = normalize(name, ascii=True)
    if name is None:
        return []
    return [n for n in name.split(' ') if len(n) > 1]


def iter_tokens(limit=100000):
    """Go through all the names in the index."""
    query = {'_source': {'include': 'names'}}
    index = entities_read_index(schema=Entity.LEGAL_ENTITY)
    seen = 0
    for res in scan(es, index=index, query=query, scroll='1410m'):
        seen += 1
        if seen % 1000 == 0:
            log.info("Names: %s", seen)
        if limit is not None and seen > limit:
            return
        for name in ensure_list(res.get('_source', {}).get('names')):
            yield from name_tokens(name)


def compute_name_frequencies():
    """Compute a numeric distribution of name frequencies."""
    # Count how often each name part (i.e. token) shows up across
    # the whole of the dataset or a sample.
    # This is very memory-intense and could be sent out to redis.
    # Doing it in redis is also icky because of the need to iterate
    # the data later, and because it would need to be fully reset
    # before each run of this. Maybe a hash would be a useful
    # structure here?
    pipe = kv.pipeline(transaction=False)
    pipe.delete(TOKEN_KEY)
    for idx, token in enumerate(iter_tokens()):
        pipe.hincrby(TOKEN_KEY, token, 1)
        if idx > 0 and idx % 1000 == 0:
            pipe.execute()
            pipe = kv.pipeline(transaction=False)
    pipe.execute()

    # Next, count how often each count occurs, i.e. make a histogram
    # of name frequency.
    counts = {}
    max_count = 0
    for _, count in kv.hscan_iter(TOKEN_KEY):
        count = int(count)
        # Leave out one-offs because they skew and aren't really
        # useful in any way.
        if count == 1:
            continue
        if count not in counts:
            counts[count] = 0
        counts[count] += 1
        # Find out what the maximum count is.
        max_count = max((count, max_count))

    total = 0
    pipe = kv.pipeline(transaction=False)
    pipe.delete(DIST_KEY)
    for count in range(max_count, 1, -1):
        total += counts.get(count, 0)
        pipe.hset(DIST_KEY, count, total)
    pipe.set(TOTAL_KEY, total)
    pipe.execute()


def name_frequency(name):
    total = float(kv.get(TOTAL_KEY) or 1)
    tokens = name_tokens(name)
    counts = kv.hmget(TOKEN_KEY, tokens)
    counts = [int(c or 1) for c in counts]
    dists = kv.hmget(DIST_KEY, counts)
    dists = [int(d or 0) / total for d in dists]
    score = 1 - sum(dists)
    # TODO: maybe we can normalise this over the number of
    # characters in the string such that it biases towards
    # longer names with rare name parts.
    print(tokens, counts, dists, score)
    # dist = kv.hgetall(DIST_KEY).items()
    # dist = ((int(k), int(v)) for k, v in dist)
    # for count, num in sorted(dist):
    #     print(count, num)
